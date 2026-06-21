import { Types } from 'mongoose';
import { Paper } from '../models/Paper';
import { workspaceRepository } from '../repositories/WorkspaceRepository';
import { AppError } from '../utils/AppError';

export class AIInsightsService {
  async getInsights(paperId: string, userId: string) {
    const paper = await Paper.findById(paperId);
    if (!paper || !paper.isActive) {
      throw AppError.notFound('Paper not found');
    }

    const isMember = await workspaceRepository.isMember(paper.workspace.toString(), userId);
    if (!isMember) {
      throw AppError.forbidden('Access denied to this paper');
    }

    return {
      aiInsights: paper.aiInsights || null,
      aiInsightsStatus: paper.aiInsightsStatus || 'pending'
    };
  }

  async generateInsights(paperId: string, userId: string) {
    const paper = await Paper.findById(paperId);
    if (!paper || !paper.isActive) {
      throw AppError.notFound('Paper not found');
    }

    const isMember = await workspaceRepository.isMember(paper.workspace.toString(), userId);
    if (!isMember) {
      throw AppError.forbidden('Access denied to this paper');
    }

    const title = paper.title || '';
    const abstract = paper.extractedMetadata?.abstract || '';
    const keywords = paper.extractedMetadata?.keywords || '';

    // Check if abstract is missing, empty, or too short to produce reliable insights
    if (!abstract.trim() || abstract.trim().length < 30) {
      throw AppError.badRequest('Insufficient extracted metadata for AI Insights generation.');
    }

    // Check Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[AIInsightsService] GEMINI_API_KEY environment variable is not configured');
      throw new Error('Gemini API key is not configured.');
    }

    // Set status to processing
    await Paper.findByIdAndUpdate(paperId, {
      $set: { aiInsightsStatus: 'processing' }
    });

    try {
      const prompt = `You are an academic assistant designed to help students understand research papers and prepare for project reviews/viva examinations.
Given a paper's Title, Abstract, and Keywords, generate a structured guide containing exactly three sections in JSON format:

Title: ${title}
Abstract: ${abstract}
Keywords: ${keywords}

Requirements:
1. "executiveSummary": Provide a student-friendly explanation of the paper. It must consist of 3 to 5 concise paragraphs. Explain what the paper is about, why the topic matters, what was studied, and the main conclusion. Simplify technical concepts and language instead of just repeating the abstract.
2. "keyFindings": Present the most important takeaways from the paper. Provide 5 to 10 concise bullet points. Focus on practical takeaways and research value, and do not copy sentences directly from the abstract.
3. "vivaQuestions": Help a student prepare for project reviews and viva examinations. Provide 5 to 10 likely viva questions generated specifically from this paper's details. They should help a student explain the paper's contribution and methodology clearly.

Output MUST be a JSON object conforming strictly to this TypeScript type:
{
  "executiveSummary": string;
  "keyFindings": string[];
  "vivaQuestions": string[];
}

Ensure the response contains ONLY the valid JSON object and no markdown code blocks or other text around it.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: any = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini returned an empty response or unexpected structure.');
      }

      // Clean response in case markdown tags are wrapped around JSON
      rawText = rawText.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '').trim();
      }

      const parsed = JSON.parse(rawText);
      if (!parsed.executiveSummary || !Array.isArray(parsed.keyFindings) || !Array.isArray(parsed.vivaQuestions)) {
        throw new Error('Parsed response does not contain the required executiveSummary, keyFindings, or vivaQuestions.');
      }

      // Update paper with completed insights
      const updatedPaper = await Paper.findByIdAndUpdate(
        paperId,
        {
          $set: {
            aiInsights: {
              executiveSummary: parsed.executiveSummary,
              keyFindings: parsed.keyFindings,
              vivaQuestions: parsed.vivaQuestions,
              generatedAt: new Date()
            },
            aiInsightsStatus: 'completed'
          }
        },
        { new: true }
      );

      if (!updatedPaper) {
        throw new Error('Paper not found when saving generated insights.');
      }

      return updatedPaper;
    } catch (err: any) {
      console.error(`[AIInsightsService] Failed to generate insights for paper ${paperId}:`, err);
      
      // Update paper status to failed
      await Paper.findByIdAndUpdate(paperId, {
        $set: { aiInsightsStatus: 'failed' }
      });
      
      throw err;
    }
  }
}

export const aiInsightsService = new AIInsightsService();
