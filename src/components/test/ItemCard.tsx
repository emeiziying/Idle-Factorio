import React from "react";
import { Box, Tooltip } from "@mui/material";
import type { Item, Recipe } from "../../types/index";
import type { ManualCraftingValidation } from "../../utils/manualCraftingValidator";
import {
  getValidationReasonText,
  getValidationCategoryText,
} from "../../utils/manualCraftingValidator";
import FactorioIcon from "../common/FactorioIcon";
import { DataService } from "../../services/DataService";
import { useIsMobile } from "../../hooks/useIsMobile";

interface ItemCardProps {
  item: Item;
  validation: ManualCraftingValidation;
  recipes: Recipe[];
}

const ItemCard: React.FC<ItemCardProps> = ({ item, validation }) => {
  const dataService = DataService.getInstance();
  const localizedName = dataService.getLocalizedItemName(item.id);
  const isMobile = useIsMobile();

  // 获取验证状态的本地化文本
  const reasonText = getValidationReasonText(validation.reason);
  const categoryText = getValidationCategoryText(validation.category);

  return (
    <Tooltip
      title={
        <Box>
          <Box>{localizedName}</Box>
          <Box fontSize="0.8rem" color="text.secondary">
            {reasonText}
          </Box>
          <Box fontSize="0.7rem" color="text.secondary">
            类别: {categoryText}
          </Box>
        </Box>
      }
      placement="top"
      arrow
      enterDelay={500}
    >
      <Box
        sx={{
          width: isMobile ? 44 : 52,
          height: isMobile ? 44 : 52,
          position: "relative",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: validation.canCraftManually
            ? "success.main"
            : "error.main",
          borderRadius: 1,
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          "&:hover": {
            bgcolor: "action.hover",
            borderColor: "primary.main",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(33, 150, 243, 0.2)",
          },
        }}
      >
        {/* 物品图标 */}
        <FactorioIcon itemId={item.id} size={isMobile ? 44 : 52} />
      </Box>
    </Tooltip>
  );
};

export default ItemCard;
