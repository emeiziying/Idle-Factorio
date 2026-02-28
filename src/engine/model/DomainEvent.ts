export type DomainEvent =
  | {
      type: 'research/completed';
      techId: string;
    }
  | {
      type: 'technology/unlocked';
      techId: string;
    }
  | {
      type: 'facility/no-fuel';
      instanceId: string;
    }
  | {
      type: 'facility/no-power';
      instanceId: string;
    }
  | {
      type: 'facility/no-resource';
      instanceId: string;
    }
  | {
      type: 'facility/output-full';
      instanceId: string;
    };
