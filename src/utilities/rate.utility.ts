import { sankey } from '@/d3-sankey';
import { coalesce } from '@/helpers';
import {
  AdjustedDataset,
  DisplayRateInfo,
  EnergyType,
  Entities,
  ItemSettings,
  Objective,
  ObjectiveType,
  ObjectiveUnit,
  Rational,
  rational,
  Recipe,
  RecipeSettings,
  Step,
  toEntities,
} from '@/models';
import type { ItemsState } from '@/store/modules/itemsSlice';

const ROOT_ID = '';

export class RateUtility {
  static objectiveNormalizedRate(
    objective: Objective,
    itemsState: ItemsState,
    beltSpeed: Entities<Rational>,
    displayRateInfo: DisplayRateInfo,
    data: AdjustedDataset
  ): Rational {
    // Ignore unit entirely when maximizing, do not adjust if unit is Machines
    if (
      objective.unit === ObjectiveUnit.Machines ||
      objective.type === ObjectiveType.Maximize
    ) {
      return objective.value;
    }

    const rate = objective.value;
    let factor = rational(1n);
    switch (objective.unit) {
      case ObjectiveUnit.Items: {
        factor = displayRateInfo.value.reciprocal();
        break;
      }
      case ObjectiveUnit.Belts: {
        const beltId = itemsState[objective.targetId].beltId;
        if (beltId) {
          factor = beltSpeed[beltId];
        }
        break;
      }
      case ObjectiveUnit.Wagons: {
        const wagonId = itemsState[objective.targetId].wagonId;
        if (wagonId) {
          const item = data.itemEntities[objective.targetId];
          const wagon = data.itemEntities[wagonId];
          if (item.stack && wagon.cargoWagon) {
            factor = item.stack
              .mul(wagon.cargoWagon.size)
              .div(displayRateInfo.value);
          } else if (wagon.fluidWagon) {
            factor = wagon.fluidWagon.capacity.div(displayRateInfo.value);
          }
        }
        break;
      }
    }

    // Adjust based on productivity for technology objectives
    const recipe =
      data.adjustedRecipe[data.itemRecipeIds[objective.targetId][0]];
    if (recipe?.isTechnology) {
      factor = factor.mul(recipe.productivity);
    }

    return rate.mul(factor);
  }

  static addEntityValue(
    step: Step,
    key: 'parents' | 'outputs',
    parentId: string,
    value: Rational
  ): void {
    const obj = step[key];
    if (!obj) {
      step[key] = { [parentId]: value };
    } else if (obj[parentId]) {
      obj[parentId] = obj[parentId].add(value);
    } else {
      obj[parentId] = value;
    }
  }

  static adjustPowerPollution(step: Step, recipe: Recipe): void {
    if (step.machines?.nonzero() && !recipe.part) {
      if (recipe.drain?.nonzero() ?? recipe.consumption?.nonzero()) {
        // Reset power
        step.power = rational(0n);

        // Calculate drain
        if (recipe.drain?.nonzero()) {
          const machines = step.machines.ceil();

          step.power = step.power.add(machines.mul(recipe.drain));
        }
        // Calculate consumption
        if (recipe.consumption?.nonzero()) {
          step.power = step.power.add(step.machines.mul(recipe.consumption));
        }
      }

      // Calculate pollution
      if (recipe.pollution?.nonzero()) {
        step.pollution = step.machines.mul(recipe.pollution);
      }
    }
  }

  static normalizeSteps(
    steps: Step[],
    objectives: Objective[],
    itemsState: Entities<ItemSettings>,
    recipesState: Entities<RecipeSettings>,
    beaconReceivers: Rational | null,
    beltSpeed: Entities<Rational>,
    dispRateInfo: DisplayRateInfo,
    data: AdjustedDataset
  ): Step[] {
    const _steps = this.copy(steps);

    for (const step of _steps) {
      this.calculateParentsOutputs(step, _steps);
    }

    const objectiveEntities = toEntities(objectives);

    for (const step of _steps) {
      this.calculateSettings(step, objectiveEntities, recipesState);
      this.calculateBelts(step, itemsState, beltSpeed, data);
      this.calculateBeacons(step, beaconReceivers, data);
      this.calculateDisplayRate(step, dispRateInfo);
      this.calculateChecked(step, itemsState, recipesState, objectiveEntities);
    }

    this.sortBySankey(_steps);
    return this.calculateHierarchy(_steps);
  }

  static calculateParentsOutputs(step: Step, steps: Step[]): void {
    if (step.recipe && step.machines?.nonzero()) {
      const recipe = step.recipe;
      const quantity = step.machines.div(recipe.time);
      for (const itemId of Object.keys(recipe.in)) {
        if (recipe.in[itemId].nonzero()) {
          const amount = recipe.in[itemId].mul(quantity);
          const itemStep = steps.find((s) => s.itemId === itemId);
          if (itemStep != null) {
            this.addEntityValue(itemStep, 'parents', step.id, amount);
          }
        }
      }
      for (const itemId of Object.keys(recipe.out)) {
        if (recipe.out[itemId].nonzero()) {
          const amount = recipe.out[itemId].mul(quantity);
          const itemStep = steps.find((s) => s.itemId === itemId);
          if (itemStep?.items?.nonzero()) {
            this.addEntityValue(
              step,
              'outputs',
              itemId,
              amount.div(itemStep.items)
            );
          }
        }
      }
    }
  }

  static calculateSettings(
    step: Step,
    objectiveEntities: Entities<Objective>,
    recipesState: Entities<RecipeSettings>
  ): void {
    if (step.recipeId) {
      if (step.recipeObjectiveId) {
        step.recipeSettings = objectiveEntities[step.recipeObjectiveId];
      } else {
        step.recipeSettings = recipesState[step.recipeId];
      }
    }
  }

  static calculateBelts(
    step: Step,
    itemsState: Entities<ItemSettings>,
    beltSpeed: Entities<Rational>,
    data: AdjustedDataset
  ): void {
    let noItems = false;
    if (step.recipeId != null && step.recipeSettings != null) {
      const machineId = step.recipeSettings.machineId;
      if (machineId != null) {
        const machine = data.machineEntities[machineId];
        const recipe = data.recipeEntities[step.recipeId];
        // No belts/wagons on research rows or rocket part rows
        noItems = !!(recipe.isTechnology ?? (machine.silo && !recipe.part));
      }
    }
    if (noItems) {
      delete step.belts;
      delete step.wagons;
    } else if (step.itemId != null) {
      const belt = itemsState[step.itemId].beltId;
      if (step.items != null && belt != null) {
        step.belts = step.items.div(beltSpeed[belt]);
      }
      const wagon = itemsState[step.itemId].wagonId;
      if (step.items != null && wagon != null) {
        const item = data.itemEntities[step.itemId];
        if (item.stack) {
          step.wagons = step.items.div(
            data.cargoWagonEntities[wagon].size.mul(item.stack)
          );
        } else {
          step.wagons = step.items.div(data.fluidWagonEntities[wagon].capacity);
        }
      }
    }
  }

  static calculateBeacons(
    step: Step,
    beaconReceivers: Rational | null,
    data: AdjustedDataset
  ): void {
    if (
      !beaconReceivers?.nonzero() ||
      !step.recipeId ||
      !step.machines?.nonzero() ||
      !!data.recipeEntities[step.recipeId].part ||
      !step.recipeSettings
    ) {
      return;
    }

    const machines = step.machines;

    const settings = step.recipeSettings;
    if (settings.beacons == null) return;

    step.recipeSettings = {
      ...step.recipeSettings,
      ...{
        beacons: settings.beacons.map((b) => {
          let total = b.total;
          if (b.id != null) {
            if (b.count != null && total == null) {
              total = machines.ceil().mul(b.count).div(beaconReceivers);
              if (total.lt(b.count)) {
                // Can't be less than beacon count
                total = b.count;
              }
            }

            const beacon = data.beaconEntities[b.id];
            if (
              beacon.type === EnergyType.Electric &&
              beacon.usage != null &&
              total != null
            ) {
              step.power = (step.power ?? rational(0n)).add(
                total.mul(beacon.usage)
              );
            }
          }

          return { ...b, total };
        }),
      },
    };
  }

  static calculateDisplayRate(step: Step, dispRateInfo: DisplayRateInfo): void {
    if (step.items) {
      if (step.parents) {
        for (const key of Object.keys(step.parents)) {
          step.parents[key] = step.parents[key].div(step.items);
        }
      }
      step.items = step.items.mul(dispRateInfo.value);
    }
    if (step.surplus) {
      step.surplus = step.surplus.mul(dispRateInfo.value);
    }
    if (step.wagons) {
      step.wagons = step.wagons.mul(dispRateInfo.value);
    }
    if (step.pollution) {
      step.pollution = step.pollution.mul(dispRateInfo.value);
    }
    if (step.output) {
      step.output = step.output.mul(dispRateInfo.value);
    }
  }

  static calculateChecked(
    step: Step,
    itemsState: Entities<ItemSettings>,
    recipesState: Entities<RecipeSettings>,
    objectiveEntities: Entities<Objective>
  ): void {
    // Priority: 1) Item state, 2) Recipe objective state, 3) Recipe state
    if (step.itemId != null) {
      step.checked = itemsState[step.itemId].checked;
    } else if (step.recipeObjectiveId != null) {
      step.checked = objectiveEntities[step.recipeObjectiveId].checked;
    } else if (step.recipeId != null) {
      step.checked = recipesState[step.recipeId].checked;
    }
  }

  /** Generates a simple sankey diagram and sorts steps by their node depth */
  static sortBySankey(steps: Step[]): void {
    interface SimpleNode {
      id: string;
      stepId: string;
    }
    interface SimpleLink {
      source: string;
      target: string;
      value: number;
    }

    const stepMap = steps.reduce((e: Entities<Step>, s) => {
      e[s.id] = s;
      return e;
    }, {});
    const nodes: SimpleNode[] = [];
    const links: SimpleLink[] = [];

    for (const step of steps) {
      if (step.itemId) {
        const id = `i|${step.itemId}`;
        nodes.push({ id, stepId: step.id });
        if (step.parents) {
          for (const stepId of Object.keys(step.parents)) {
            if (stepId === '') continue;
            links.push({
              source: id,
              target: `r|${stepMap[stepId].recipeId}`,
              value: 1,
            });
          }
        }
      }

      if (step.recipeId) {
        const id = `r|${step.recipeId}`;
        nodes.push({ id, stepId: step.id });
        if (step.outputs) {
          for (const itemId of Object.keys(step.outputs)) {
            links.push({ source: id, target: `i|${itemId}`, value: 1 });
          }
        }
      }
    }

    if (!nodes.length || !links.length) return;

    const result = sankey<SimpleNode, SimpleLink>().nodeId((d) => d.id)({
      nodes,
      links,
    });
    for (const step of steps) {
      step.depth = result.nodes.find((n) => n.stepId === step.id)?.depth;
    }

    steps.sort((a, b) => coalesce(b.depth, 0) - coalesce(a.depth, 0));
  }

  static calculateHierarchy(steps: Step[]): Step[] {
    // Determine parents
    const parents: Entities<string> = {};
    for (const step of steps) {
      if (
        step.parents == null ||
        step.parents[''] ||
        Object.keys(step.parents).length > 1
      ) {
        parents[step.id] = ROOT_ID;
      } else {
        const stepId = Object.keys(step.parents)[0];
        const parent = steps.find((s) => s.id === stepId);
        if (parent) {
          if (step.id === parent.id) {
            parents[step.id] = ROOT_ID;
          } else {
            parents[step.id] = parent.id;
          }
        }
      }
    }

    // Set up hierarchy groups
    const groups: Entities<Step[]> = {};
    for (const step of steps) {
      const parentId = parents[step.id];
      if (!groups[parentId]) {
        groups[parentId] = [];
      }
      groups[parentId].push(step);
    }

    // Perform recursive sort
    const sorted = this.sortRecursive(groups, ROOT_ID, []);

    // Add back any steps left out (potentially circular loops)
    sorted.push(...steps.filter((s) => !sorted.includes(s)));

    return sorted;
  }

  static sortRecursive(
    groups: Entities<Step[]>,
    id: string,
    result: Step[]
  ): Step[] {
    if (!groups[id]) {
      return [];
    }
    const group = groups[id];

    for (const s of group) {
      result.push(s);
      this.sortRecursive(groups, s.id, result);
    }

    return result;
  }

  static copy(steps: Step[]): Step[] {
    return steps.map((s) =>
      s.parents ? { ...s, ...{ parents: { ...s.parents } } } : { ...s }
    );
  }
}
