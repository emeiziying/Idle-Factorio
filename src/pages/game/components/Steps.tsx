import { useAppSelector } from '@/store/hooks';
import {
  getStepTree,
  getSteps,
  getTotals,
} from '@/store/modules/objectivesSlice';
import { useWhyDidYouUpdate } from 'ahooks';

const Steps = () => {
  const steps = useAppSelector(getSteps);
  const totals = useAppSelector(getTotals);
  const stepTree = useAppSelector(getStepTree);

  useWhyDidYouUpdate('Steps', { steps, totals, stepTree });

  return <div>Steps</div>;
};

export default Steps;
