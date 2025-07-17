import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './index';
import { updateProgress, startCrafting, completeCrafting } from '../store/slices/craftingSlice';
import { addItem, removeItem } from '../store/slices/inventorySlice';
import { recipesById } from '../data';

export const useGameLoop = () => {
  const dispatch = useAppDispatch();
  const craftingQueue = useAppSelector(state => state.crafting.queue);
  const inventory = useAppSelector(state => state.inventory.stocks);
  const productionRates = useAppSelector(state => state.production.rates);
  
  const lastUpdateRef = useRef(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  
  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;
      lastUpdateRef.current = now;
      
      // 更新生产
      Object.entries(productionRates).forEach(([itemId, rate]) => {
        if (rate.net !== 0) {
          const deltaAmount = (rate.net * deltaTime) / 1000;
          if (deltaAmount > 0) {
            dispatch(addItem({ itemId, amount: deltaAmount }));
          } else {
            dispatch(removeItem({ itemId, amount: -deltaAmount }));
          }
        }
      });
      
      // 更新制作队列
      const activeCrafting = craftingQueue.find(item => item.status === 'crafting');
      if (activeCrafting) {
        const recipe = recipesById[activeCrafting.recipeId];
        if (recipe) {
          const timePerItem = recipe.time * 1000; // 转换为毫秒
          const elapsed = now - activeCrafting.startTime;
          
          // 计算已完成的物品数量
          const completedItems = Math.floor(elapsed / timePerItem);
          const remainingItems = activeCrafting.quantity - completedItems;
          
          if (remainingItems > 0) {
            // 计算当前物品的进度
            const currentItemElapsed = elapsed % timePerItem;
            const currentItemProgress = (currentItemElapsed / timePerItem) * 100;
            
            // 总进度 = (已完成数量 + 当前进度) / 总数量
            const totalProgress = ((completedItems + currentItemProgress / 100) / activeCrafting.quantity) * 100;
            dispatch(updateProgress({ id: activeCrafting.id, progress: totalProgress }));
          } else {
            // 所有物品已完成
            dispatch(updateProgress({ id: activeCrafting.id, progress: 100 }));
            
            // 添加产品
            recipe.products.forEach(product => {
              dispatch(addItem({
                itemId: product.itemId,
                amount: product.amount * activeCrafting.quantity
              }));
            });
            
            // 完成制作
            dispatch(completeCrafting(activeCrafting.id));
          }
        }
      } else {
        // 开始下一个制作
        const nextItem = craftingQueue.find(item => item.status === 'waiting');
        if (nextItem) {
          const recipe = recipesById[nextItem.recipeId];
          if (recipe) {
            // 检查原料是否充足（需要检查整个数量）
            let canStart = true;
            for (const ingredient of recipe.ingredients) {
              const required = ingredient.amount * nextItem.quantity;
              if ((inventory[ingredient.itemId] || 0) < required) {
                canStart = false;
                break;
              }
            }
            
            if (canStart) {
              // 开始制作前先扣减原料
              recipe.ingredients.forEach(ingredient => {
                dispatch(removeItem({
                  itemId: ingredient.itemId,
                  amount: ingredient.amount * nextItem.quantity
                }));
              });
              
              dispatch(startCrafting(nextItem.id));
            }
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dispatch, craftingQueue, inventory, productionRates]);
};