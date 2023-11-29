import { DraggableListItem } from 'components/common/DraggableListItem';
import type { EvaluationStep } from 'lib/spaces/getProposalWorkflowTemplates';

export function WorkflowEvaluationRow({
  key,
  evaluation,
  onDelete,
  onSave,
  onChangeOrder,
  readOnly
}: {
  key: string;
  evaluation: EvaluationStep;
  onDelete: (id: string) => void;
  onSave: (evaluation: EvaluationStep) => void;
  onChangeOrder: (selectedId: string, targetId: string) => void;
  readOnly: boolean;
}) {
  return (
    <DraggableListItem
      changeOrderHandler={onChangeOrder}
      name={`evaluationItem-${key}`}
      itemId={evaluation.id}
      disabled={readOnly}
    >
      {evaluation.title}
    </DraggableListItem>
  );
}
