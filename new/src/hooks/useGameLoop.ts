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
  const animationFrameRef = useRef<number>();
  
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
          const totalTime = timePerItem * activeCrafting.quantity;
          const elapsed = now - activeCrafting.startTime;
          const progress = Math.min(100, (elapsed / totalTime) * 100);
          
          dispatch(updateProgress({ id: activeCrafting.id, progress }));
          
          // 检查是否完成
          if (progress >= 100) {
            // 检查原料是否充足
            let canComplete = true;
            for (const ingredient of recipe.ingredients) {
              const required = ingredient.amount * activeCrafting.quantity;
              if ((inventory[ingredient.itemId] || 0) < required) {
                canComplete = false;
                break;
              }
            }
            
            if (canComplete) {
              // 消耗原料
              recipe.ingredients.forEach(ingredient => {
                dispatch(removeItem({
                  itemId: ingredient.itemId,
                  amount: ingredient.amount * activeCrafting.quantity
                }));
              });
              
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
        }
      } else {
        // 开始下一个制作
        const nextItem = craftingQueue.find(item => item.status === 'waiting');
        if (nextItem) {
          const recipe = recipesById[nextItem.recipeId];
          if (recipe) {
            // 检查原料是否充足
            let canStart = true;
            for (const ingredient of recipe.ingredients) {
              if ((inventory[ingredient.itemId] || 0) < ingredient.amount) {
                canStart = false;
                break;
              }
            }
            
            if (canStart) {
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