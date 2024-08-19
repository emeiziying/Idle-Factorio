import { Rational } from './rational';
import { Step } from './step';

export interface StepOutput {
  recipeId?: string;
  recipeObjectiveId?: string;
  inputs?: boolean;
  value: Rational;
  machines?: Rational;
  step?: Step;
}

export interface StepDetail {
  tabs: MenuItem[];
  outputs: StepOutput[];
  recipeIds: string[];
  allRecipesIncluded: boolean;
}
