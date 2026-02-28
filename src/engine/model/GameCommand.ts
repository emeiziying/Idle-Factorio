export type GameCommand =
  | {
      type: 'facility/build';
      facilityId: string;
    }
  | {
      type: 'facility/set-recipe';
      instanceId: string;
      recipeId: string;
    }
  | {
      type: 'facility/refuel';
      instanceId: string;
      itemId: string;
      amount: number;
    }
  | {
      type: 'research/start';
      techId: string;
    }
  | {
      type: 'research/queue-add';
      techId: string;
    };
