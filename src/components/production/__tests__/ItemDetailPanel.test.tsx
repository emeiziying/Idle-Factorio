import type { Recipe } from '@/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ItemDetailPanel from '../ItemDetailPanel';

const handleManualCraftMock = vi.fn();
const closeMessageMock = vi.fn();
const manualRecipe: Recipe = {
  id: 'wood-mining',
  name: 'Wood',
  category: 'intermediate-products',
  time: 0.5,
  in: {},
  out: { wood: 2 },
  flags: ['mining'],
};

vi.mock('@/hooks/useItemRecipes', () => ({
  useItemRecipes: () => ({ usedInRecipes: [], hasFacilityRecipes: false }),
}));

vi.mock('@/hooks/useCrafting', () => ({
  useCrafting: () => ({
    handleManualCraft: handleManualCraftMock,
    closeMessage: closeMessageMock,
    showMessage: {
      open: true,
      message: '已添加手动合成任务: wood x1',
      severity: 'success' as const,
    },
  }),
}));

vi.mock('@/components/detail/ItemDetailHeader', () => ({
  default: () => <div data-testid="item-detail-header" />,
}));

vi.mock('@/components/detail/RecipeFacilitiesCard', () => ({
  default: () => <div data-testid="recipe-facilities-card" />,
}));

vi.mock('@/components/detail/UsageCard', () => ({
  default: () => <div data-testid="usage-card" />,
}));

vi.mock('@/components/detail/InventoryManagementCard', () => ({
  default: () => <div data-testid="inventory-management-card" />,
}));

vi.mock('@/components/detail/ManualCraftingCard', () => ({
  default: ({
    onManualCraft,
  }: {
    onManualCraft: (itemId: string, quantity: number, recipe: Recipe) => void;
  }) => (
    <button onClick={() => onManualCraft('wood', 1, manualRecipe)} type="button">
      触发手动合成
    </button>
  ),
}));

describe('ItemDetailPanel', () => {
  beforeEach(() => {
    handleManualCraftMock.mockClear();
    closeMessageMock.mockClear();
  });

  it('wires ManualCraftingCard action to parent useCrafting handler and shows feedback message', () => {
    render(
      <ItemDetailPanel
        item={{ id: 'wood', name: 'wood', category: 'intermediate-products', stack: 100, row: 1 }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '触发手动合成' }));

    expect(handleManualCraftMock).toHaveBeenCalledWith('wood', 1, manualRecipe);
    expect(screen.getByText('已添加手动合成任务: wood x1')).toBeInTheDocument();
  });
});
