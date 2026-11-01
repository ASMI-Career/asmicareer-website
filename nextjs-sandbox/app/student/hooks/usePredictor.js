import { useState } from 'react';

export default function usePredictor({ config }) {
  const [predictorScore, setPredictorScore] = useState('');
  const [predictedRank, setPredictedRank] = useState(null);
  const [cpInputMode, setCpInputMode] = useState('rank');
  const [cpRankInput, setCpRankInput] = useState('');
  const [cpSelectedStates, setCpSelectedStates] = useState([]);  // multi-select
  const [cpStateSearch, setCpStateSearch] = useState('');
  const [cpSelectedTypes, setCpSelectedTypes] = useState([]);    // multi-select
  const [cpQuota, setCpQuota] = useState('All');
  const [cpMaxBudget, setCpMaxBudget] = useState(3000000);
  const [cpSortBy, setCpSortBy] = useState('chance');            // chance | fees_asc | fees_desc | name
  const [cpSearchFilter, setCpSearchFilter] = useState('');
  const [cpScoreInput, setCpScoreInput] = useState('');
  const [cpState, setCpState] = useState('All');
  const [cpScoreState, setCpScoreState] = useState('All');
  const [cpScoreSort, setCpScoreSort] = useState('chance');
  const [cpCategory, setCpCategory] = useState('Open');
  const [cpScoreCourse, setCpScoreCourse] = useState(config.predictor ? config.predictor.mainCourse : '');
  const [cpPoolFilter, setCpPoolFilter] = useState('All');
  const [cpTypeFilter, setCpTypeFilter] = useState('All');

  return { predictorScore, setPredictorScore, predictedRank, setPredictedRank, cpInputMode, setCpInputMode, cpRankInput, setCpRankInput, cpSelectedStates, setCpSelectedStates, cpStateSearch, setCpStateSearch, cpSelectedTypes, setCpSelectedTypes, cpQuota, setCpQuota, cpMaxBudget, setCpMaxBudget, cpSortBy, setCpSortBy, cpSearchFilter, setCpSearchFilter, cpScoreInput, setCpScoreInput, cpState, setCpState, cpScoreState, setCpScoreState, cpScoreSort, setCpScoreSort, cpCategory, setCpCategory, cpScoreCourse, setCpScoreCourse, cpPoolFilter, setCpPoolFilter, cpTypeFilter, setCpTypeFilter };
}
