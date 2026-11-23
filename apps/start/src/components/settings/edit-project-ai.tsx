import type { IServiceProjectWithClients } from '@openpanel/core';
import { AI_ASSISTANT_CONTEXT_MAX_LENGTH } from '@openpanel/core/modules/project/project.constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Widget, WidgetBody, WidgetHead } from '@/components/widget';
import { handleError, useTRPC } from '@/integrations/trpc/react';

interface Props {
  project: IServiceProjectWithClients;
}

export default function EditProjectAi({ project }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const mutation = useMutation(
    trpc.project.update.mutationOptions({
      onError: handleError,
      onSuccess: () => {
        toast.success('AI settings updated');
        queryClient.invalidateQueries(
          trpc.project.getProjectWithClients.queryFilter({
            projectId: project.id,
          })
        );
      },
    })
  );

  return (
    <div className="space-y-6">
      <AssistantContext project={project} />
      <Widget>
        <WidgetHead>
          <span className="title">Content storage</span>
        </WidgetHead>
        <WidgetBody className="col gap-4">
          <div className="row items-center justify-between gap-6">
            <div className="col gap-1">
              <Label htmlFor="ai-store-content">
                Store prompts and completions
              </Label>
              <p className="text-muted-foreground text-sm">
                When off, OpenPanel keeps model, tokens, cost, latency and
                errors for every call but drops the messages, outputs and tool
                definitions before they are stored. Stored content expires after
                30 days either way.
              </p>
            </div>
            <Switch
              checked={project.aiStoreContent}
              disabled={mutation.isPending}
              id="ai-store-content"
              onCheckedChange={(checked) =>
                mutation.mutate({ id: project.id, aiStoreContent: checked })
              }
            />
          </div>
        </WidgetBody>
      </Widget>
      <Widget>
        <WidgetHead>
          <span className="title">Pricing</span>
        </WidgetHead>
        <WidgetBody>
          <p className="text-muted-foreground text-sm">
            Cost is computed at ingest from a built-in price catalog covering
            the major providers. Send <code className="font-mono">cost</code> on
            an event to store the price your gateway reports instead. Calls to a
            model that is not in the catalog are stored with a cost of zero.
          </p>
        </WidgetBody>
      </Widget>
    </div>
  );
}

function AssistantContext({ project }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const saved = project.aiAssistantContext ?? '';
  const [draft, setDraft] = useState(saved);
  const mutation = useMutation(
    trpc.project.update.mutationOptions({
      onError: handleError,
      onSuccess: () => {
        toast.success('Assistant context saved');
        queryClient.invalidateQueries(
          trpc.project.getProjectWithClients.queryFilter({
            projectId: project.id,
          })
        );
      },
    })
  );
  const dirty = draft.trim() !== saved.trim();

  return (
    <Widget>
      <WidgetHead>
        <span className="title">Assistant context</span>
      </WidgetHead>
      <WidgetBody className="col gap-4">
        <div className="col gap-1">
          <Label htmlFor="ai-assistant-context">
            Custom prompt for every chat
          </Label>
          <p className="text-muted-foreground text-sm">
            The AI assistant reads this at the start of every conversation in
            this project. Describe your product, what your events and properties
            mean, the values they take and the terms your team uses, so
            questions about them are understood.
          </p>
        </div>
        <Textarea
          className="min-h-48 font-mono"
          disabled={mutation.isPending}
          id="ai-assistant-context"
          maxLength={AI_ASSISTANT_CONTEXT_MAX_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={
            'We run a subscription fitness app.\n- "workout_done": a workout finished; "duration" is in seconds.\n- "plan" is free, pro or team.\n- "Active member" means a profile with a workout in the last 7 days.'
          }
          value={draft}
        />
        <div className="row items-center justify-between gap-4">
          <span className="text-muted-foreground text-xs">
            {draft.length.toLocaleString()} /{' '}
            {AI_ASSISTANT_CONTEXT_MAX_LENGTH.toLocaleString()}
          </span>
          <div className="row gap-2">
            <Button
              disabled={!dirty || mutation.isPending}
              onClick={() => setDraft(saved)}
              variant="outline"
            >
              Reset
            </Button>
            <Button
              disabled={!dirty}
              loading={mutation.isPending}
              onClick={() =>
                mutation.mutate({
                  id: project.id,
                  aiAssistantContext: draft.trim() || null,
                })
              }
            >
              Save
            </Button>
          </div>
        </div>
      </WidgetBody>
    </Widget>
  );
}
