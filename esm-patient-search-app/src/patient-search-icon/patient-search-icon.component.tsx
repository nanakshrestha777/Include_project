import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { preload } from 'swr';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeaderGlobalAction } from '@carbon/react';
import { Close, Search } from '@carbon/react/icons';
import {
  isDesktop,
  navigate,
  openmrsFetch,
  restBaseUrl,
  useLayoutType,
  useOnClickOutside,
  useSession,
} from '@openmrs/esm-framework';

import CompactPatientSearchComponent from '../compact-patient-search/compact-patient-search.component';
import PatientSearchOverlay from '../patient-search-overlay/patient-search-overlay.component';

import styles from './patient-search-icon.scss';

const PatientSearchLaunch: React.FC = () => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const { page } = useParams();
  const { user } = useSession();
  const [searchParams] = useSearchParams();

  const userUuid = user?.uuid;
  const userRoles = useMemo(() => user?.roles?.map((r) => r.display?.toLowerCase()) || [], [user]);
  const isSearchPage = useMemo(() => page === 'search', [page]);
  const initialSearchTerm = isSearchPage ? searchParams.get('query') || '' : '';

  const [showSearchInput, setShowSearchInput] = useState(isSearchPage);
  const [canClickOutside, setCanClickOutside] = useState(false);
  const hideSearchIcon = userRoles.includes('self registration');

  const ref = useOnClickOutside<HTMLDivElement>(() => {
    if (isDesktop(layout) && !isSearchPage) {
      setShowSearchInput(false);
    }
  }, canClickOutside);

  const closePatientSearch = useCallback(() => {
    if (isSearchPage) {
      navigate({
        to: window.sessionStorage.getItem('searchReturnUrl') ?? `${restBaseUrl}/`,
      });
      window.sessionStorage.removeItem('searchReturnUrl');
    }
    setShowSearchInput(false);
  }, [isSearchPage]);

  const resetToInitialState = useCallback(() => {
    setShowSearchInput(false);
    setCanClickOutside(false);
  }, []);

  // 📦 Preload user data on mount (not just on hover)
  useEffect(() => {
    if (userUuid) {
      preload(`${restBaseUrl}/user/${userUuid}`, openmrsFetch);
    }
  }, [userUuid]);

  // 🔁 Keep click-outside tracking in sync
  useEffect(() => {
    setCanClickOutside(showSearchInput && !isSearchPage);
  }, [showSearchInput, isSearchPage]);

  return (
    <div className={styles.patientSearchIconWrapper} ref={ref}>
      {showSearchInput ? (
        <>
          {isDesktop(layout) ? (
            <CompactPatientSearchComponent
              isSearchPage={isSearchPage}
              initialSearchTerm={initialSearchTerm}
              shouldNavigateToPatientSearchPage
              onPatientSelect={resetToInitialState}
            />
          ) : (
            <PatientSearchOverlay
              onClose={closePatientSearch}
              query={initialSearchTerm}
              patientClickSideEffect={closePatientSearch}
            />
          )}
          <div className={styles.closeButton}>
            <HeaderGlobalAction
              aria-label={t('closeSearch', 'Close Search Panel')}
              className={styles.activeSearchIconButton}
              data-testid="closeSearchIcon"
              name="CloseSearchIcon"
              onClick={closePatientSearch}>
              <Close size={20} />
            </HeaderGlobalAction>
          </div>
        </>
      ) : (
        <HeaderGlobalAction
          aria-label={t('searchPatient', 'Search patient')}
          className={`${styles.searchIconButton} ${hideSearchIcon ? styles.hidden : ''}`}
          data-testid="searchPatientIcon"
          name="SearchPatientIcon"
          onClick={() => setShowSearchInput(true)}>
          <Search size={20} />
        </HeaderGlobalAction>
      )}
    </div>
  );
};

export default PatientSearchLaunch;
