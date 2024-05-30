'use client'
import IconItem from '@/components/IconItem'
import data from '@/data/data.json'
import type { ItemJson, ModData } from '@/models'
import { Card, CardBody, Tab, Tabs } from '@nextui-org/react'
import { useWhyDidYouUpdate } from 'ahooks'
import { useMemo } from 'react'

export default function Home() {
  const tabs = useMemo(() => {
    const { categories } = data as never as ModData

    return categories.map((category) => {
      const items = data.items.filter(
        (item) => item.category === category.id,
      ) as ItemJson[]
      const groups = items.reduce((pre, cur) => {
        ;(pre[cur.row] = pre[cur.row] || []).push(cur)
        return pre
      }, {} as Record<number, ItemJson[]>)

      return {
        ...category,
        item_groups: Object.keys(groups)
          .map(Number)
          .sort((a, b) => a - b)
          .map((key) => groups[key] || []),
      }
    })
  }, [])

  useWhyDidYouUpdate('Home', [tabs])

  return (
    <main>
      <div className="flex justify-center py-10">
        <div className="w-full max-w-7xl px-6">
          <Tabs aria-label="Options">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                title={
                  <div className="flex items-center">
                    <IconItem name={tab.icon || tab.id} />
                    {tab.name}
                  </div>
                }
              >
                <Card>
                  <CardBody>
                    <div>
                      {tab.item_groups.map((group, index) => (
                        <div key={index} className="flex flex-wrap ">
                          {group.map((item) => (
                            <div key={item.id} className="p-2">
                              <IconItem
                                name={item.icon || item.id}
                                text={item.iconText}
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </Tab>
            ))}
          </Tabs>
        </div>
      </div>
    </main>
  )
}