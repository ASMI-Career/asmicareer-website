'use client';

import { useState } from 'react';
import './dashboard.css';
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

  const shell = useShell();
  const docs = useDocuments(currentToken);
  const shortlistApi = useShortlist(currentToken);
  const predictor = usePredictor();
  const cutoff = useCutoffExplorer();
  const institutes = useInstitutes();
  const student = useStudent({
    setCurrentToken,
    setCheckedDocs: docs.setCheckedDocs, setDocCategory: docs.setDocCategory, setDocQuota: docs.setDocQuota,
    docCategory: docs.docCategory, docQuota: docs.docQuota,
    setShortlistGroups: shortlistApi.setShortlistGroups,
    setCpScoreInput: predictor.setCpScoreInput,
  });
  const catalog = useCatalog(student.studentCategory);

  if (student.authState !== 'ok') return <TokenGate state={student.authState} />;

  const ctx = { currentToken, ...shell, ...docs, ...shortlistApi, ...predictor, ...cutoff, ...institutes, ...student, ...catalog };

  return (
    <Shell {...ctx}>
      {ctx.activeTab === 'dashboard' && <Dashboard {...ctx} />}
      {ctx.activeTab === 'predictor' && <Predictor {...ctx} />}
      {ctx.activeTab === 'cutoff' && <CutoffExplorer {...ctx} />}
      {ctx.activeTab === 'institutes' && <Institutes {...ctx} />}
      {ctx.activeTab === 'checklist' && <Documents {...ctx} />}
    </Shell>
  );
}
