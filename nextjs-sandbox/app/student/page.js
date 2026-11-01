'use client';

import { useState } from 'react';
import './dashboard.css';
import { streamFromLocation, getStreamConfig, endpointFor } from './config';
import useShell from './hooks/useShell';
import useDocuments from './hooks/useDocuments';
import useShortlist from './hooks/useShortlist';
import usePredictor from './hooks/usePredictor';
import useCutoffExplorer from './hooks/useCutoffExplorer';
import useInstitutes from './hooks/useInstitutes';
import useStudent from './hooks/useStudent';
import useCatalog from './hooks/useCatalog';
import TokenGate from './components/TokenGate';
import Shell from './components/Shell';
import Dashboard from './components/Dashboard';
import Predictor from './components/Predictor';
import CutoffExplorer from './components/CutoffExplorer';
import Institutes from './components/Institutes';
import Documents from './components/Documents';

// The student dashboard page. All state lives in the hooks below, which are always called, so what a student typed in one
// tab (filters, inputs) is still there after switching tabs. Each tab is a component that receives everything as props.
export default function StudentDashboard() {
  const [currentToken, setCurrentToken] = useState('');   // read from the link by useStudent; also needed by the documents and shortlist hooks
  // The stream (medical / engineering) comes from the token prefix in the link and does not change while the page is open.
  const [streamId] = useState(streamFromLocation);
  const config = getStreamConfig(streamId);
  const endpoint = endpointFor(streamId);

  const shell = useShell();
  const docs = useDocuments({ config, endpoint, currentToken });
  const shortlistApi = useShortlist({ config, endpoint, currentToken });
  const predictor = usePredictor({ config });
  const cutoff = useCutoffExplorer();
  const institutes = useInstitutes();
  const student = useStudent({
    config, endpoint,
    setCurrentToken,
    setCheckedDocs: docs.setCheckedDocs, setDocCategory: docs.setDocCategory, setDocQuota: docs.setDocQuota,
    docCategory: docs.docCategory, docQuota: docs.docQuota,
    setShortlistGroups: shortlistApi.setShortlistGroups,
    setCpScoreInput: predictor.setCpScoreInput,
  });
  const catalog = useCatalog({ config, studentCategory: student.studentCategory, studentTracks: student.studentTracks });

  if (student.authState !== 'ok') return <TokenGate state={student.authState} />;

  // A link like ?tab=predictor on a stream without that module falls back (Medical keeps its old behaviour for unknown tabs).
  const activeTab = (config.modules.includes(shell.activeTab) || !config.unknownTabFallback) ? shell.activeTab : config.unknownTabFallback;

  const ctx = { config, streamId, currentToken, ...shell, activeTab, ...docs, ...shortlistApi, ...predictor, ...cutoff, ...institutes, ...student, ...catalog };

  return (
    <Shell {...ctx}>
      {activeTab === 'dashboard' && <Dashboard {...ctx} />}
      {activeTab === 'predictor' && config.modules.includes('predictor') && <Predictor {...ctx} />}
      {activeTab === 'cutoff' && config.modules.includes('cutoff') && <CutoffExplorer {...ctx} />}
      {activeTab === 'institutes' && config.modules.includes('institutes') && <Institutes {...ctx} />}
      {activeTab === 'checklist' && config.modules.includes('checklist') && <Documents {...ctx} />}
    </Shell>
  );
}
