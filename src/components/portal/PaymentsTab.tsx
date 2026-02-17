import React from 'react';
import { useActiveDraft, useChangeOrders, usePayments } from '@/hooks/useProjectData';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useIncomingPayments } from '@/hooks/payments/useIncomingPayments';
import { useOutgoingPayments } from '@/hooks/payments/useOutgoingPayments';
import { usePaymentCalculations } from '@/hooks/payments/usePaymentCalculations';
import { useMaterialsForPayments } from '@/hooks/payments/useMaterialsForPayments';
import { PaymentsSummaryCards } from '@/components/portal/payments/PaymentsSummaryCards';
import { IncomingPaymentsSection } from '@/components/portal/payments/IncomingPaymentsSection';
import { OutgoingPaymentsSection } from '@/components/portal/payments/OutgoingPaymentsSection';
import { ProjectSummaryCard } from '@/components/portal/payments/ProjectSummaryCard';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';
import { ProjectDocumentsSection } from './ProjectDocumentsSection';
import { Project } from '@/types';
import { useClientData } from '@/hooks/materials/useClientData';
import { Can } from '@/components/Can';
import { usePrice } from '@/contexts/PriceContext';

interface PaymentsTabProps {
  projectId: string;
  project?: Project;
  userRole?: string;
  readOnly?: boolean;
}

export default function PaymentsTab({ projectId, project, userRole, readOnly = false }: PaymentsTabProps) {
  const { can } = usePermissions();
  const { hidden } = usePrice();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  // Permission checks for payments components
  const canViewTopTotals = can('component.payments_toptotals.view');
  const canViewIncoming = can('component.payments_incoming.view');
  const canEditIncoming = can('component.payments_incoming.edit');
  const canViewIncomingPrices = can('component.payments_incomingviewprices.view');
  const canViewOutgoing = can('component.payments_outgoing.view');
  const canEditOutgoing = can('component.payments_outgoing.edit');
  const canViewOutgoingPrices = can('component.payments_outgoingviewprices.view');
  const canViewProjectSummary = can('component.payments_projectsummary.view');
  
  // Permission checks for Client Documents
  // Component-level edit permission overrides tab-level read-only
  const canViewClientDocuments = can('component.payments_projectdocuments.view');
  const canEditClientDocuments = can('component.payments_projectdocuments.edit');
  const clientDocumentsReadOnly = !canEditClientDocuments;
  
  // Get client data for ProjectDocumentsSection
  const { clientData } = useClientData(project?.clientId || '');

  // Component-level edit permissions override tab-level read-only
  const incomingPaymentsReadOnly = !canEditIncoming;
  const outgoingPaymentsReadOnly = !canEditOutgoing;

  // Fetch project data
  const { activeDraftItems, activeDraftMultiplier, activeVersionId } = useActiveDraft(projectId, true);
  const { activeChangeOrders } = useChangeOrders(projectId, true);
  const { incoming: incomingPaymentsData, refetch: refetchPayments } = usePayments(projectId, true);

  // Custom hooks for payments management
  const incomingPayments = useIncomingPayments({
    projectId,
    workspaceId,
    userId: user?.id,
    incomingPaymentsData,
    refetchPayments,
  });

  const outgoingPayments = useOutgoingPayments({
    projectId,
    workspaceId,
    userId: user?.id,
  });

  const { materials } = useMaterialsForPayments({
    activeVersionId,
    activeChangeOrders,
  });

  const calculations = usePaymentCalculations({
    activeDraftItems,
    activeDraftMultiplier,
    activeChangeOrders,
    incomingPayments: incomingPayments.incoming,
    outgoingPayments: outgoingPayments.outgoing,
  });

  // Material selection handler for outgoing payments
  const handleMaterialSelect = (materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    if (mat) {
      outgoingPayments.setOutgoingForm({
        ...outgoingPayments.outgoingForm,
        item: mat.name,
        link: mat.link || '',
        totalPrice: String(mat.price * mat.qty),
        qty: String(mat.qty),
        notes: mat.notes || '',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 min-h-screen">
      {/* Top Summary Section - fully hidden when client view (hidden) is active */}
      {canViewTopTotals && !hidden && (
        <PaymentsSummaryCards
          projectTotal={calculations.projectTotal}
          contractTotal={calculations.contractTotal}
          changeOrdersTotal={calculations.changeOrdersTotal}
          paidTotal={calculations.paidTotal}
          balance={calculations.balance}
          nextPayment={calculations.nextPayment}
        />
      )}

      {/* Incoming Payments */}
      {canViewIncoming && (
        <IncomingPaymentsSection
          incoming={incomingPayments.incoming}
          incomingForm={incomingPayments.incomingForm}
          onFormChange={incomingPayments.setIncomingForm}
          editingId={incomingPayments.editingId}
          editingData={incomingPayments.editingData}
          onEditingDataChange={incomingPayments.setEditingData}
          validationErrors={incomingPayments.validationErrors}
          onAdd={incomingPayments.handleAdd}
          onEdit={incomingPayments.handleEdit}
          onSave={incomingPayments.handleSave}
          onCancel={incomingPayments.handleCancel}
          onDelete={incomingPayments.setDeleteId}
          canViewPrices={canViewIncomingPrices}
          readOnly={incomingPaymentsReadOnly}
        />
      )}

      {/* Outgoing Payments */}
      {canViewOutgoing && (
        <OutgoingPaymentsSection
          outgoing={outgoingPayments.outgoing}
          outgoingForm={outgoingPayments.outgoingForm}
          onFormChange={outgoingPayments.setOutgoingForm}
          editingId={outgoingPayments.editingId}
          editingData={outgoingPayments.editingData}
          onEditingDataChange={outgoingPayments.setEditingData}
          validationErrors={outgoingPayments.validationErrors}
          materials={materials}
          onMaterialSelect={handleMaterialSelect}
          onAdd={outgoingPayments.handleAdd}
          onEdit={outgoingPayments.handleEdit}
          onSave={outgoingPayments.handleSave}
          onCancel={outgoingPayments.handleCancel}
          onDelete={outgoingPayments.setDeleteId}
          canViewPrices={canViewOutgoingPrices}
          readOnly={outgoingPaymentsReadOnly}
        />
      )}

      {/* Project Summary - fully hidden when client view (hidden) is active */}
      {canViewProjectSummary && !hidden && (
        <ProjectSummaryCard
          totalProjectCost={calculations.totalProjectCost}
          totalSpentOnProject={calculations.totalSpentOnProject}
        />
      )}

      {/* Delete Confirmation Dialogs */}
      <ConfirmDeleteDialog
        open={incomingPayments.deleteId !== null}
        onOpenChange={(open) => !open && incomingPayments.setDeleteId(null)}
        onConfirm={incomingPayments.handleDelete}
        title="Delete Payment"
        description="Are you sure you want to delete this incoming payment? This action cannot be undone."
      />

      <ConfirmDeleteDialog
        open={outgoingPayments.deleteId !== null}
        onOpenChange={(open) => !open && outgoingPayments.setDeleteId(null)}
        onConfirm={outgoingPayments.handleDelete}
        title="Delete Payment"
        description="Are you sure you want to delete this outgoing payment? This action cannot be undone."
      />

      {/* Client Documents Section */}
      {project && project.id !== project.clientId && canViewClientDocuments && (
        <ProjectDocumentsSection
          projectId={project.id}
          project={project}
          clientData={clientData}
          activeDraftItems={activeDraftItems}
          activeDraftMultiplier={activeDraftMultiplier}
          tabIdentifier="payments"
          readOnly={clientDocumentsReadOnly}
          userRole={userRole}
        />
      )}
    </div>
  );
}
