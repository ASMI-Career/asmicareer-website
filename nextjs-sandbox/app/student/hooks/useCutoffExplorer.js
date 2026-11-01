import { useState } from 'react';

export default function useCutoffExplorer() {
  const [ceViewMode, setCeViewMode] = useState('database');
  const [ceCollegeSearch, setCeCollegeSearch] = useState('');
  const [ceState, setCeState] = useState('All');
  const [ceSingleCollege, setCeSingleCollege] = useState('');

  return { ceViewMode, setCeViewMode, ceCollegeSearch, setCeCollegeSearch, ceState, setCeState, ceSingleCollege, setCeSingleCollege };
}
