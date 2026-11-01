import { useState } from 'react';

export default function useInstitutes() {
  const [instSearch, setInstSearch] = useState('');
  const [instStateSearch, setInstStateSearch] = useState('');
  const [instSelectedStates, setInstSelectedStates] = useState([]);
  const [instType, setInstType] = useState('All');
  const [instCourse, setInstCourse] = useState('All');
  const [instSortBy, setInstSortBy] = useState('Recommended');
  const [instMaxFees, setInstMaxFees] = useState(3000000);
  const [instTabType, setInstTabType] = useState('All');

  return { instSearch, setInstSearch, instStateSearch, setInstStateSearch, instSelectedStates, setInstSelectedStates, instType, setInstType, instCourse, setInstCourse, instSortBy, setInstSortBy, instMaxFees, setInstMaxFees, instTabType, setInstTabType };
}
