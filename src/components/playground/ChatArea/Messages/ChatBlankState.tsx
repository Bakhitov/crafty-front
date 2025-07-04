'use client'

import { motion } from 'framer-motion'

const ChatBlankState = () => {
  return (
    <section
      className="font-geist flex flex-col items-center text-center"
      aria-label="Welcome message"
    >
      <div className="flex max-w-3xl flex-col gap-y-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-3xl font-[400] tracking-tight"
        >
          <div className="flex items-center justify-center gap-x-2 whitespace-nowrap">
            <span className="flex items-center">Start chat!</span>
          </div>
          <p>with Crafty agents</p>
        </motion.h1>
      </div>
    </section>
  )
}

export default ChatBlankState
