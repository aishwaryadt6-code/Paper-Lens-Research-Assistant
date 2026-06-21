import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCreateWorkspace, useUpdateWorkspace } from '../../hooks/useWorkspaces';
import { toast } from '../ui/Toast';
import { extractApiError } from '../ui/utils';
import { Workspace } from '../../types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  editTarget?: Workspace | null;
}

export function CreateWorkspaceModal({ open, onClose, editTarget }: CreateWorkspaceModalProps) {
  const isEdit = !!editTarget;
  const create = useCreateWorkspace();
  const update = useUpdateWorkspace();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (editTarget) {
      reset({ name: editTarget.name, description: editTarget.description });
    } else {
      reset({ name: '', description: '' });
    }
  }, [editTarget, open, reset]);

  async function onSubmit(data: FormData) {
    try {
      if (isEdit) {
        await update.mutateAsync({ id: editTarget!._id, data });
        toast.success('Workspace updated');
      } else {
        await create.mutateAsync(data);
        toast.success('Workspace created');
      }
      onClose();
    } catch (err) {
      toast.error(isEdit ? 'Failed to update workspace' : 'Failed to create workspace', extractApiError(err));
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Workspace' : 'Create Workspace'}
      description={
        isEdit
          ? 'Update your workspace details.'
          : 'Create a new workspace to organize your research papers.'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          placeholder="e.g. ML Research 2024"
          error={errors.name?.message}
          {...register('name')}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            {...register('description')}
            placeholder="Describe the purpose of this workspace..."
            rows={3}
            className="w-full rounded-lg border border-surface-border dark:border-dark-border bg-white dark:bg-dark-secondary text-slate-900 dark:text-slate-100 text-sm px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none transition-all"
          />
        </div>
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEdit ? 'Save Changes' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
