import React, { type FC } from 'react'
import { ReferenceData, Reference } from '@/types/playground'

interface ReferencesSectionProps {
  references: ReferenceData[]
}

interface ReferenceItemProps {
  reference: Reference
}

const ReferenceItem: FC<ReferenceItemProps> = ({ reference }) => (
  <div className="bg-background-secondary hover:bg-background-secondary/80 relative flex h-[63px] w-[190px] cursor-default flex-col justify-between overflow-hidden rounded-md p-3 transition-colors">
    <p className="text-primary text-sm font-medium">{reference.name}</p>
    <p className="text-primary/40 truncate text-xs">{reference.content}</p>
  </div>
)

const ReferencesSection: FC<ReferencesSectionProps> = ({ references }) => {
  if (!references || references.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {references.map((referenceData, index) => (
        <div
          key={`${referenceData.query}-${index}`}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap gap-3">
            {referenceData.references.map((reference, refIndex) => (
              <ReferenceItem
                key={`${reference.name}-${reference.meta_data.chunk}-${refIndex}`}
                reference={reference}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ReferencesSection
