import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineLoading } from '@carbon/react';
import { FormEngine } from '@openmrs/esm-form-engine-lib';
import { showModal, type Visit, navigate } from '@openmrs/esm-framework';
import {
  clinicalFormsWorkspace,
  type DefaultPatientWorkspaceProps,
  launchPatientWorkspace,
} from '@openmrs/esm-patient-common-lib';
import FormError from './form-error.component';
import useFormSchema from '../hooks/useFormSchema';
import styles from './form-renderer.scss';
import { useSession } from '@openmrs/esm-framework';
interface FormRendererProps extends DefaultPatientWorkspaceProps {
  additionalProps?: Record<string, any>;
  encounterUuid?: string;
  formUuid: string;
  patientUuid: string;
  visit?: Visit;
  clinicalFormsWorkspaceName?: string;
}

const FormRenderer: React.FC<FormRendererProps> = ({
  additionalProps,
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  encounterUuid,
  formUuid,
  patientUuid,
  promptBeforeClosing,
  visit,
  clinicalFormsWorkspaceName = clinicalFormsWorkspace,
}) => {
  const { t } = useTranslation();
  const { schema, error, isLoading } = useFormSchema(formUuid);
  const openClinicalFormsWorkspaceOnFormClose = additionalProps?.openClinicalFormsWorkspaceOnFormClose ?? false;
  const formSessionIntent = additionalProps?.formSessionIntent ?? '*';

  const { user } = useSession();
  const userRoles = user?.roles?.map((role) => role.display?.toLowerCase()) || [];
  const isTestUser = userRoles.includes('self registration');

  const handleCloseForm = useCallback(() => {
    closeWorkspace();
    if (!encounterUuid && openClinicalFormsWorkspaceOnFormClose) {
      launchPatientWorkspace(clinicalFormsWorkspaceName);
    }
  }, [closeWorkspace, encounterUuid, openClinicalFormsWorkspaceOnFormClose, clinicalFormsWorkspaceName]);

  const handleConfirmQuestionDeletion = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      const dispose = showModal('form-engine-delete-question-confirm-modal', {
        onCancel: () => {
          dispose();
          reject();
        },
        onConfirm: () => {
          dispose();
          resolve();
        },
      });
    });
  }, []);

  const handleMarkFormAsDirty = useCallback(
    (isDirty: boolean) => promptBeforeClosing(() => isDirty),
    [promptBeforeClosing],
  );
  // const handleSubmit = useCallback(() => {
  //   closeWorkspaceWithSavedChanges?.();

  //   if (isTestUser) {
  //     // For test users, do normal behavior (no redirect)
  //     // You can leave empty or do something else if needed
  //     // e.g. closeWorkspaceWithSavedChanges already closes form and returns
  //     return;
  //   } else {
  //     // For others, redirect to home
  //     window.location.href = '/openmrs/spa/home';
  //   }
  // }, [closeWorkspaceWithSavedChanges]);
  const handleSubmit = useCallback(() => {
    closeWorkspaceWithSavedChanges?.();

    if (isTestUser) {
      // For test users, redirect to home
      window.location.href = '/openmrs/spa/home';
    }

    // For others: do nothing else — allow default redirect to chart
  }, [closeWorkspaceWithSavedChanges, isTestUser]);
  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <InlineLoading className={styles.loading} description={`${t('loading', 'Loading')} ...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FormError closeWorkspace={handleCloseForm} />
      </div>
    );
  }

  return (
    <>
      {schema && (
        <FormEngine
          encounterUUID={encounterUuid}
          formJson={schema}
          handleClose={handleCloseForm}
          handleConfirmQuestionDeletion={handleConfirmQuestionDeletion}
          markFormAsDirty={handleMarkFormAsDirty}
          mode={additionalProps?.mode}
          formSessionIntent={formSessionIntent}
          onSubmit={handleSubmit}
          patientUUID={patientUuid}
          visit={visit}
        />
      )}
    </>
  );
};

export default FormRenderer;
