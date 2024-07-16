import type { ItemsState } from '@/store/modules/itemsSlice';
import type {
  getMachinesState,
  MachinesState,
} from '@/store/modules/machinesSlice';
import type { RecipesState } from '@/store/modules/recipesSlice';

import { coalesce, fnPropsNotNullish } from '@/helpers';
import {
  AdjustedDataset,
  AdjustedRecipe,
  AdjustmentData,
  Beacon,
  Belt,
  cloneRecipe,
  CostSettings,
  Dataset,
  EnergyType,
  Entities,
  finalizeRecipe,
  isRecipeObjective,
  ItemId,
  ItemSettings,
  Machine,
  MachineJson,
  Objective,
  Rational,
  rational,
  Recipe,
  RecipeJson,
  RecipeSettings,
} from '@/models';

export class RecipeUtility {
  static MIN_FACTOR = rational(1n, 5n);
  static POLLUTION_FACTOR = rational(60n);
  static MIN_FACTORIO_RECIPE_TIME = rational(1n, 60n);

  /** Determines what option to use based on preferred rank */
  static bestMatch(options: string[], rank: string[]): string {
    if (options.length > 1) {
      for (const r of rank) {
        if (options.indexOf(r) !== -1) {
          // Return first matching option in rank list
          return r;
        }
      }
    }
    return options[0];
  }

  static fuelOptions(
    entity: MachineJson | Machine,
    data: Dataset
  ): SelectItem<string>[] {
    if (entity.fuel) {
      const fuel = data.itemEntities[entity.fuel];
      return [{ value: fuel.id, label: fuel.name }];
    }

    if (entity.fuelCategories == null) return [];

    const fuelCategories = entity.fuelCategories;
    const allowed = data.fuelIds
      .map((f) => data.itemEntities[f])
      .filter(fnPropsNotNullish('fuel'))
      .filter((f) => fuelCategories.includes(f.fuel.category));
    return allowed.map(
      (f): SelectItem<string> => ({ value: f.id, label: f.name })
    );
  }

  static moduleOptions(
    entity: Machine | Beacon,
    recipeId: string | null,
    data: Dataset
  ): SelectItem<string>[] {
    // Get all modules
    let allowed = data.moduleIds
      .map((i) => data.itemEntities[i])
      .filter(fnPropsNotNullish('module'));

    if (recipeId != null) {
      const recipe = data.recipeEntities[recipeId];
      if (!recipe.isMining && !recipe.isTechnology) {
        // Filter for modules allowed on this recipe
        allowed = allowed.filter(
          (m) =>
            !m.module.limitation ||
            data.limitations[m.module.limitation][recipeId]
        );
      }
    }

    // Filter for modules allowed on this entity
    if (entity.disallowedEffects) {
      for (const disallowedEffect of entity.disallowedEffects) {
        allowed = allowed.filter((m) => m.module[disallowedEffect] == null);
      }
    }

    const options = allowed.map(
      (m): SelectItem => ({ value: m.id, label: m.name })
    );
    options.unshift({ label: 'None', value: ItemId.Module });

    return options;
  }

  /** Determines default array of modules for a given recipe */
  static defaultModules(
    options: SelectItem[],
    moduleRankIds: string[],
    count: Rational
  ): string[] {
    const tempModule = this.bestMatch(
      options.map((o) => o.value),
      moduleRankIds
    );
    return new Array<string>(count.toNumber()).fill(tempModule);
  }

  static adjustRecipe(
    recipeId: string,
    adjustmentData: AdjustmentData,
    settings: RecipeSettings,
    itemsState: Entities<ItemSettings>,
    data: Dataset
  ): AdjustedRecipe {
    const recipe: AdjustedRecipe = {
      ...cloneRecipe(data.recipeEntities[recipeId]),
      ...{ productivity: rational(1n), produces: new Set(), output: {} },
    };

    const { miningBonus, researchBonus, netProductionOnly } = adjustmentData;

    if (settings.machineId != null) {
      const machine = data.machineEntities[settings.machineId];

      if (machine.speed != null) {
        // Adjust for machine speed
        recipe.time = recipe.time.div(machine.speed);
      } else {
        // Calculate based on belt speed
        // Use minimum speed of all inputs/outputs in recipe
        const ids = [
          ...Object.keys(recipe.in).filter((i) => recipe.in[i].nonzero()),
          ...Object.keys(recipe.out).filter((i) => recipe.out[i].nonzero()),
        ];
        const belts = ids
          .map((i) => itemsState[i].beltId)
          .filter((b): b is string => b != null)
          .map((beltId) => data.beltEntities[beltId]);
        let minSpeed = rational(0n);
        for (const b of belts.filter((b): b is Belt => b != null)) {
          if (minSpeed.lt(b.speed)) minSpeed = b.speed;
        }
        recipe.time = recipe.time.div(minSpeed);
      }

      if (recipe.isTechnology) {
        // Adjust for research factor
        recipe.time = recipe.time.div(researchBonus);
      }

      // Calculate factors
      let speed = rational(1n);
      let prod = rational(1n);
      let consumption = rational(1n);
      let pollution = rational(1n);

      if (recipe.isMining) {
        // Adjust for mining bonus
        prod = prod.add(miningBonus);
      }

      // Modules
      const factor = rational(1n);
      if (settings.moduleIds?.length) {
        for (const id of settings.moduleIds) {
          const tempModule = data.moduleEntities[id];
          if (tempModule) {
            if (tempModule.speed) {
              speed = speed.add(tempModule.speed.mul(factor));
            }

            if (tempModule.productivity) {
              prod = prod.add(tempModule.productivity.mul(factor));
            }

            if (tempModule.consumption) {
              consumption = consumption.add(tempModule.consumption.mul(factor));
            }

            if (tempModule.pollution) {
              pollution = pollution.add(tempModule.pollution.mul(factor));
            }
          }
        }
      }

      // Beacons
      if (settings.beacons != null) {
        for (const beaconSettings of settings.beacons) {
          const beaconModules = beaconSettings.moduleIds?.filter(
            (m) => m !== ItemId.Module && data.moduleEntities[m]
          );
          if (
            beaconModules?.length &&
            beaconSettings.id &&
            beaconSettings.count?.nonzero()
          ) {
            for (const id of beaconModules) {
              const tempModule = data.moduleEntities[id];
              const beacon = data.beaconEntities[beaconSettings.id];
              const factor = beaconSettings.count.mul(beacon.effectivity);
              if (tempModule.speed) {
                speed = speed.add(tempModule.speed.mul(factor));
              }
              if (tempModule.productivity) {
                prod = prod.add(tempModule.productivity.mul(factor));
              }
              if (tempModule.consumption) {
                consumption = consumption.add(
                  tempModule.consumption.mul(factor)
                );
              }
              if (tempModule.pollution) {
                pollution = pollution.add(tempModule.pollution.mul(factor));
              }
            }
          }
        }
      }

      // Check for speed, consumption, or pollution below minimum value (20%)
      if (speed.lt(this.MIN_FACTOR)) {
        speed = this.MIN_FACTOR;
      }
      if (consumption.lt(this.MIN_FACTOR)) {
        consumption = this.MIN_FACTOR;
      }
      if (pollution.lt(this.MIN_FACTOR)) {
        pollution = this.MIN_FACTOR;
      }

      // Calculate module/beacon effects
      // Speed
      recipe.time = recipe.time.div(speed);

      // In Factorio, minimum recipe time is 1/60s (1 tick)
      if (recipe.time.lt(this.MIN_FACTORIO_RECIPE_TIME)) {
        recipe.time = this.MIN_FACTORIO_RECIPE_TIME;
      }

      // Productivity
      for (const outId of Object.keys(recipe.out)) {
        if (recipe.catalyst?.[outId]) {
          // Catalyst - only multiply prod by extra produced
          const catalyst = recipe.catalyst[outId];
          const affected = recipe.out[outId].sub(catalyst);
          // Only change output if affected amount > 0
          if (affected.gt(rational(0n))) {
            recipe.out[outId] = catalyst.add(affected.mul(prod));
          }
        } else {
          recipe.out[outId] = recipe.out[outId].mul(prod);
        }
      }

      recipe.productivity = prod;

      // Power
      recipe.drain = machine.drain;
      const usage =
        (recipe.usage ? recipe.usage : machine.usage) ?? rational(0n);

      recipe.consumption =
        machine.type === EnergyType.Electric
          ? usage.mul(consumption)
          : rational(0n);

      // Pollution
      recipe.pollution =
        machine.pollution && settings.machineId !== ItemId.Pumpjack
          ? machine.pollution
              .div(this.POLLUTION_FACTOR)
              .mul(pollution)
              .mul(consumption)
          : rational(0n);

      // Add machine consumption
      if (machine.consumption) {
        const consumption = machine.consumption;
        for (const id of Object.keys(consumption)) {
          const amount = recipe.time.div(rational(60n)).mul(consumption[id]);
          recipe.in[id] = (recipe.in[id] || rational(0n)).add(amount);
        }
      }

      // Calculate burner fuel inputs
      if (settings.fuelId) {
        const fuel = data.fuelEntities[settings.fuelId];

        if (fuel) {
          const fuelIn = recipe.time
            .mul(usage)
            .div(fuel.value)
            .div(rational(1000n));

          recipe.in[settings.fuelId] = (
            recipe.in[settings.fuelId] || rational(0n)
          ).add(fuelIn);

          if (fuel.result) {
            recipe.out[fuel.result] = (
              recipe.out[fuel.result] || rational(0n)
            ).add(fuelIn);
          }
        }
      }
    }

    if (netProductionOnly) {
      for (const outId of Object.keys(recipe.out)) {
        const output = recipe.out[outId];
        if (recipe.in[outId] != null) {
          // Recipe contains loop; reduce to net production
          const input = recipe.in[outId];

          if (input.gt(output)) {
            // More input, delete the output
            recipe.in[outId] = input.sub(output);
            delete recipe.out[outId];
          } else if (input.lt(output)) {
            // More output, delete the input
            recipe.out[outId] = output.sub(input);
            delete recipe.in[outId];
          } else {
            // Equal amounts, remove both
            delete recipe.in[outId];
            delete recipe.out[outId];
          }
        }
      }
    }

    return recipe;
  }

  /** Adjust rocket launch objective recipes */
  static adjustLaunchRecipeObjective(
    recipe: Recipe,
    settings: Entities<RecipeSettings>,
    data: AdjustedDataset
  ): void {
    if (!recipe.part) return;
    const partMachineId = settings[recipe.part].machineId;
    if (!partMachineId) return;
    const rocketMachine = data.machineEntities[partMachineId];
    if (!rocketMachine?.silo) return;

    const rocketRecipe = data.adjustedRecipe[recipe.part];
    const itemId = Object.keys(rocketRecipe.out)[0];
    const factor = rocketMachine.silo.parts.div(rocketRecipe.out[itemId]);
    recipe.time = rocketRecipe.time.mul(factor);
  }

  /** Adjust rocket launch and rocket part recipes */
  static adjustSiloRecipes(
    adjustedRecipe: Entities<AdjustedRecipe>,
    settings: Entities<RecipeSettings>,
    data: Dataset
  ): Entities<AdjustedRecipe> {
    for (const partId of Object.keys(adjustedRecipe)) {
      const partMachineId = settings[partId].machineId;
      if (!partMachineId) continue;

      const rocketMachine = data.machineEntities[partMachineId];
      const rocketRecipe = adjustedRecipe[partId];
      if (!rocketMachine?.silo || rocketRecipe.part) continue;

      const itemId = Object.keys(rocketRecipe.out)[0];
      const factor = rocketMachine.silo.parts.div(rocketRecipe.out[itemId]);
      for (const launchId of Object.keys(adjustedRecipe).filter(
        (i) =>
          adjustedRecipe[i].part === partId &&
          settings[i].machineId === partMachineId
      )) {
        adjustedRecipe[launchId].time = rocketRecipe.time
          .mul(factor)
          .add(rocketMachine.silo.launch);
      }

      rocketRecipe.time = rocketRecipe.time
        .mul(factor)
        .add(rocketMachine.silo.launch)
        .div(factor);
    }

    return adjustedRecipe;
  }

  static allowsModules(recipe: RecipeJson | Recipe, machine: Machine): boolean {
    return (!machine.silo || !recipe.part) && !!machine.modules;
  }

  static adjustDataset(
    recipeIds: string[],
    excludedRecipeIds: string[],
    recipesState: Entities<RecipeSettings>,
    itemsState: Entities<ItemSettings>,
    adjustmentData: AdjustmentData,
    cost: CostSettings,
    data: Dataset
  ): AdjustedDataset {
    const recipeR = this.adjustRecipes(
      recipeIds,
      recipesState,
      itemsState,
      adjustmentData,
      data
    );
    this.adjustCost(recipeIds, recipeR, recipesState, cost, data);
    return this.finalizeData(recipeIds, excludedRecipeIds, recipeR, data);
  }

  static adjustRecipes(
    recipeIds: string[],
    recipesState: Entities<RecipeSettings>,
    itemsState: Entities<ItemSettings>,
    adjustmentData: AdjustmentData,
    data: Dataset
  ): Entities<AdjustedRecipe> {
    return this.adjustSiloRecipes(
      recipeIds.reduce((e: Entities<AdjustedRecipe>, i) => {
        e[i] = this.adjustRecipe(
          i,
          adjustmentData,
          recipesState[i],
          itemsState,
          data
        );
        return e;
      }, {}),
      recipesState,
      data
    );
  }

  static adjustCost(
    recipeIds: string[],
    recipeR: Entities<Recipe>,
    recipesState: Entities<RecipeSettings>,
    costs: CostSettings,
    data: Dataset
  ): void {
    recipeIds
      .map((i) => recipeR[i])
      .forEach((recipe) => {
        const settings = recipesState[recipe.id];
        if (settings.cost) {
          recipe.cost = settings.cost;
        } else if (recipe.cost) {
          // Recipe has a declared cost, base this on output items not machines
          // Calculate total output, sum, and multiply cost by output
          const output = Object.keys(recipe.out)
            .reduce((v, o) => v.add(recipe.out[o]), rational(0n))
            .div(recipe.time);
          recipe.cost = output.mul(recipe.cost).mul(costs.factor);
        } else {
          recipe.cost = costs.machine;
          if (settings.machineId != null && costs.footprint.nonzero()) {
            // Adjust based on machine size
            const machine = data.machineEntities[settings.machineId];
            if (machine.size != null) {
              recipe.cost = recipe.cost.mul(
                rational(machine.size[0] * machine.size[1])
              );
            }
          }
        }
      });
  }

  static finalizeData(
    recipeIds: string[],
    excludedRecipeIds: string[],
    adjustedRecipe: Entities<AdjustedRecipe>,
    data: Dataset
  ): AdjustedDataset {
    const excludedSet = new Set(excludedRecipeIds);
    const itemRecipeIds: Entities<string[]> = {};
    const itemIncludedRecipeIds: Entities<string[]> = {};
    const itemIncludedIoRecipeIds: Entities<string[]> = {};
    data.itemIds.forEach((i) => {
      itemRecipeIds[i] = [];
      itemIncludedRecipeIds[i] = [];
      itemIncludedIoRecipeIds[i] = [];
    });

    recipeIds
      .map((i) => adjustedRecipe[i])
      .forEach((recipe) => {
        finalizeRecipe(recipe);
        recipe.produces.forEach((productId) =>
          itemRecipeIds[productId].push(recipe.id)
        );

        if (!excludedSet.has(recipe.id)) {
          recipe.produces.forEach((productId) =>
            itemIncludedRecipeIds[productId].push(recipe.id)
          );

          Object.keys(recipe.output).forEach((ioId) =>
            itemIncludedIoRecipeIds[ioId].push(recipe.id)
          );
        }
      });

    return {
      ...data,
      ...{
        adjustedRecipe,
        itemRecipeIds,
        itemIncludedRecipeIds,
        itemIncludedIoRecipeIds,
      },
    };
  }

  static adjustObjective(
    objective: Objective,
    itemsState: ItemsState,
    recipesState: RecipesState,
    machinesState: MachinesState,
    adjustmentData: AdjustmentData,
    data: AdjustedDataset
  ): Objective {
    if (!isRecipeObjective(objective)) return objective;

    objective = { ...objective };
    const recipe = data.recipeEntities[objective.targetId];

    if (objective.machineId == null) {
      objective.machineId = this.bestMatch(
        recipe.producers,
        coalesce(machinesState.ids, [])
      );
    }

    const machine = data.machineEntities[objective.machineId];
    const def = machinesState.entities[objective.machineId];

    if (recipe.isBurn) {
      objective.fuelId = Object.keys(recipe.in)[0];
    } else {
      objective.fuelId = objective.fuelId ?? def?.fuelId;
    }

    objective.fuelId = objective.fuelId ?? def?.fuelId;
    objective.fuelOptions = def?.fuelOptions;

    if (machine != null && this.allowsModules(recipe, machine)) {
      objective.moduleOptions = this.moduleOptions(
        machine,
        objective.targetId,
        data
      );

      if (objective.moduleIds == null) {
        objective.moduleIds = this.defaultModules(
          objective.moduleOptions,
          coalesce(def.moduleRankIds, []),
          coalesce(machine.modules, rational(0n))
        );
      }

      if (objective.beacons == null) {
        objective.beacons = [{}];
      } else {
        objective.beacons = objective.beacons.map((b) => ({
          ...b,
        }));
      }

      for (const beaconSettings of objective.beacons) {
        beaconSettings.count = beaconSettings.count ?? def.beaconCount;
        beaconSettings.id = beaconSettings.id ?? def.beaconId;

        if (beaconSettings.id != null) {
          const beacon = data.beaconEntities[beaconSettings.id];
          beaconSettings.moduleOptions = this.moduleOptions(
            beacon,
            objective.targetId,
            data
          );

          if (beaconSettings.moduleIds == null) {
            beaconSettings.moduleIds = RecipeUtility.defaultModules(
              beaconSettings.moduleOptions,
              coalesce(def.beaconModuleRankIds, []),
              beacon.modules
            );
          }
        }
      }
    } else {
      // Machine doesn't support modules, remove any
      delete objective.moduleIds;
      delete objective.beacons;
    }

    objective.recipe = RecipeUtility.adjustRecipe(
      objective.targetId,
      adjustmentData,
      objective,
      itemsState,
      data
    );
    RecipeUtility.adjustLaunchRecipeObjective(
      objective.recipe,
      recipesState,
      data
    );
    finalizeRecipe(objective.recipe);

    return objective;
  }

  static adjustSettings(
    recipesState: RecipesState,
    machinesState: ReturnType<typeof getMachinesState>,
    data: Dataset,
    recipeId: string,
    machineId?: string
  ) {
    const defaultExcludedRecipeIds = new Set(
      coalesce(data.defaults?.excludedRecipeIds, [])
    );

    const recipe = data.recipeEntities[recipeId];

    const s: RecipeSettings = { ...recipesState[recipe.id] };
    if (machineId) s.machineId = machineId;

    if (s.excluded == null)
      s.excluded = defaultExcludedRecipeIds.has(recipe.id);

    if (s.machineId == null)
      s.machineId = RecipeUtility.bestMatch(
        recipe.producers,
        machinesState.ids
      );

    const machine = data.machineEntities[s.machineId];
    const def = machinesState.entities[s.machineId];

    if (recipe.isBurn) {
      s.fuelId = Object.keys(recipe.in)[0];
    } else {
      s.fuelId = s.fuelId ?? def?.fuelId;
    }

    s.fuelOptions = def?.fuelOptions;

    if (machine != null && RecipeUtility.allowsModules(recipe, machine)) {
      s.moduleOptions = RecipeUtility.moduleOptions(machine, recipe.id, data);

      if (s.moduleIds == null)
        s.moduleIds = RecipeUtility.defaultModules(
          s.moduleOptions,
          coalesce(def.moduleRankIds, []),
          machine.modules ?? rational(0n)
        );

      if (s.beacons == null) s.beacons = [{}];

      s.beacons = s.beacons.map((b) => ({ ...b }));

      for (const beaconSettings of s.beacons) {
        beaconSettings.count = beaconSettings.count ?? def.beaconCount;
        beaconSettings.id = beaconSettings.id ?? def.beaconId;

        if (beaconSettings.id != null) {
          const beacon = data.beaconEntities[beaconSettings.id];
          beaconSettings.moduleOptions = RecipeUtility.moduleOptions(
            beacon,
            recipe.id,
            data
          );

          if (beaconSettings.moduleIds == null)
            beaconSettings.moduleIds = RecipeUtility.defaultModules(
              beaconSettings.moduleOptions,
              coalesce(def.beaconModuleRankIds, []),
              beacon.modules
            );
        }
      }
    } else {
      // Machine doesn't support modules, remove any
      delete s.moduleIds;
      delete s.beacons;
    }

    if (s.beacons) {
      for (const beaconSettings of s.beacons) {
        if (
          beaconSettings.total != null &&
          (beaconSettings.count == null || beaconSettings.count.isZero())
        )
          // No actual beacons, ignore the total beacons
          delete beaconSettings.total;
      }
    }

    return s;
  }
}
