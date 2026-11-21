'use client';

import { useState, useEffect } from 'react';
import './dashboard.css';
import { streamFromLocation, getStreamConfig, endpointFor } from './config';
import useShell from './hooks/useShell';
import useDocuments, { useDocumentSections } from './hooks/useDocuments';
import useShortlist from './hooks/useShortlist';
import usePredictor from './hooks/usePredictor';
import useCutoffExplorer from './hooks/useCutoffExplorer';
import useInstitutes from './hooks/useInstitutes';
import useEngCutoff from './hooks/useEngCutoff';
import usePrefList from './hooks/usePrefList';
import useProfile from './hooks/useProfile';
import useStudent from './hooks/useStudent';
import useCatalog from './hooks/useCatalog';
import TokenGate from './components/TokenGate';
import Shell from './components/Shell';
import Dashboard from './components/Dashboard';
import Predictor from './components/Predictor';
import CutoffExplorer from './components/CutoffExplorer';
import EngineeringCutoff from './components/EngineeringCutoff';
import EngineeringPredictor from './components/EngineeringPredictor';
import Institutes from './components/Institutes';
import Documents from './components/Documents';
import Deadlines from './components/Deadlines';
import Tutorials from './components/Tutorials';
import Settings from './components/Settings';
import BranchGuide from './components/BranchGuide';
import PreferenceList from './components/PreferenceList';

// The student dashboard page. All state lives in the hooks below, which are always called, so what a student typed in one
// tab (filters, inputs) is still there after switching tabs. Each tab is a component that receives everything as props.
export default function StudentDashboard() {
  const [currentToken, setCurrentToken] = useState('');   // read from the link by useStudent; also needed by the documents and shortlist hooks
  // The stream (medical / engineering) comes from the token prefix in the link and does not change while the page is open.
  const [streamId] = useState(streamFromLocation);
  const config = getStreamConfig(streamId);
  const endpoint = endpointFor(streamId);

  // Engineering gets its own colours (see the [data-stream="engineering"] block at the end of dashboard.css).
  // Medical sets nothing, so its page is exactly as before.
  useEffect(() => {
    if (config.id !== 'engineering') return undefined;
    document.documentElement.setAttribute('data-stream', 'engineering');
    return () => document.documentElement.removeAttribute('data-stream');
  }, [config.id]);

  const shell = useShell();
  const docs = useDocuments({ config, endpoint, currentToken });
  const shortlistApi = useShortlist({ config, endpoint, currentToken });
  const predictor = usePredictor({ config });
  const cutoff = useCutoffExplorer();
  const institutes = useInstitutes();
  const profileApi = useProfile({ config, endpoint, currentToken });
  const student = useStudent({
    config, endpoint,
    setCurrentToken,
    setCheckedDocs: docs.setCheckedDocs, setDocCategory: docs.setDocCategory, setDocQuota: docs.setDocQuota,
    docCategory: docs.docCategory, docQuota: docs.docQuota,
    setShortlistGroups: shortlistApi.setShortlistGroups,
    setCpScoreInput: predictor.setCpScoreInput,
    onProfile: profileApi.profileOnSheet,
  });
  const docSections = useDocumentSections({ config, checkedDocs: docs.checkedDocs, docCategory: docs.docCategory, docQuota: docs.docQuota, studentTracks: student.studentTracks });
  const engCutoff = useEngCutoff({ config, studentCategory: student.studentCategory, active: shell.activeTab === 'cutoff' || shell.activeTab === 'predictor' });
  const prefList = usePrefList({ config, endpoint, currentToken, active: shell.activeTab === 'preferenceList', studentCategory: student.studentCategory, profile: profileApi.profile, prefListEnabled: profileApi.prefListEnabled, shortlistGroups: shortlistApi.shortlistGroups });
  profileApi.profileSinks.current.prefill = (v) => { engCutoff.ecPrefill(v); prefList.plPrefill(v); };
  profileApi.profileSinks.current.student = student.applyProfileToStudent;
  const catalog = useCatalog({ config, studentCategory: student.studentCategory, studentTracks: student.studentTracks });

  if (student.authState !== 'ok') return <TokenGate state={student.authState} helpline={config.dashboard.helpline} />;

  // A link like ?tab=predictor on a stream without that module falls back (Medical keeps its old behaviour for unknown tabs).
  // 'settings' is not a nav module: it exists only for streams with the profile switched on, and only once the script answered with profile_locked.
  const settingsOpen = shell.activeTab === 'settings' && profileApi.profileSupported;
  const activeTab = settingsOpen ? 'settings' : (config.modules.includes(shell.activeTab) || !config.unknownTabFallback) ? (shell.activeTab === 'settings' ? (config.unknownTabFallback || 'dashboard') : shell.activeTab) : config.unknownTabFallback;

  const ctx = { config, streamId, currentToken, ...shell, activeTab, ...docs, ...docSections, ...shortlistApi, ...predictor, ...cutoff, ...institutes, ...student, ...catalog, ...engCutoff, ...prefList, ...profileApi };

  return (
    <Shell {...ctx}>
      {activeTab === 'dashboard' && <Dashboard {...ctx} />}
      {activeTab === 'predictor' && config.modules.includes('predictor') && (config.engineeringPredictor ? <EngineeringPredictor {...ctx} /> : <Predictor {...ctx} />)}
      {activeTab === 'cutoff' && config.modules.includes('cutoff') && (config.engineeringCutoff ? <EngineeringCutoff {...ctx} /> : <CutoffExplorer {...ctx} />)}
      {activeTab === 'institutes' && config.modules.includes('institutes') && <Institutes {...ctx} />}
      {activeTab === 'checklist' && config.modules.includes('checklist') && <Documents {...ctx} />}
      {activeTab === 'deadlines' && config.modules.includes('deadlines') && <Deadlines {...ctx} />}
      {activeTab === 'settings' && <Settings {...ctx} />}
      {activeTab === 'preferenceList' && config.modules.includes('preferenceList') && config.preferenceList && <PreferenceList {...ctx} />}
      {activeTab === 'branchGuide' && config.modules.includes('branchGuide') && <BranchGuide {...ctx} />}
      {activeTab === 'tutorials' && config.modules.includes('tutorials') && <Tutorials {...ctx} />}
    </Shell>
  );
}
