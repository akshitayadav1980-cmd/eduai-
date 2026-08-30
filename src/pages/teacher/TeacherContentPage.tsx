import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, MoreVertical } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { MOCK_CONTENT, CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS } from '../../data/mockContent'
import { LANGUAGES } from '../../data/languages'
import { staggerContainer, staggerItem, fadeUp } from '../../utils/animations'

export function TeacherContentPage() {
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const languageOptions = [{ value: 'all', label: 'All Languages' }, ...LANGUAGES.map(l => ({ value: l.id, label: l.name }))]
  const typeOptions = [{ value: 'all', label: 'All Types' }, { value: 'lesson', label: 'Lesson' }, { value: 'story', label: 'Story' }, { value: 'exercise', label: 'Exercise' }, { value: 'quiz', label: 'Quiz' }]

  const filteredContent = MOCK_CONTENT.filter(c => {
    const matchSearch = c.titleKey.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
    const matchLang = langFilter === 'all' || c.languageId === langFilter
    const matchType = typeFilter === 'all' || c.type === typeFilter
    return matchSearch && matchLang && matchType
  })

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-6"
    >
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Content Library"
          description="Manage and create multilingual lessons, exercises, and quizzes."
        />
        <Button variant="primary" icon={<Plus size={16} />} iconPosition="left">
          Create Content
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="glass rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search content by title or description..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={16} />}
            aria-label="Search content"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select 
            options={languageOptions} 
            value={langFilter} 
            onChange={(e) => setLangFilter(e.target.value)}
            prefix={<Filter size={14} className="opacity-70" />}
            aria-label="Filter by language"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select 
            options={typeOptions} 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by type"
          />
        </div>
      </motion.div>

      {/* Content Grid */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredContent.map(content => {
          const typeColor = CONTENT_TYPE_COLORS[content.type] ?? 'cyan'
          
          return (
            <motion.div 
              key={content.id} 
              variants={staggerItem}
              className="glass rounded-xl border border-white/10 hover:border-white/20 transition-all p-5 flex flex-col h-full group relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-${typeColor}-500/10 text-${typeColor}-400 border border-${typeColor}-500/20`}>
                  {CONTENT_TYPE_LABELS[content.type]}
                </div>
                <IconButton label="Actions" variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1">
                  <MoreVertical size={16} />
                </IconButton>
              </div>

              {/* Title & Desc */}
              <div className="flex-1 relative z-10">
                <h3 className="text-lg font-bold text-white mb-1.5 leading-snug">{content.titleKey}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4">{content.description}</p>
                
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {content.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-300 border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">Grade {content.grade}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="text-xs font-semibold text-cyan-400 uppercase">{content.languageId}</span>
                </div>
                {content.isPublished ? (
                  <Badge variant="emerald" size="sm" dot>Published</Badge>
                ) : (
                  <Badge variant="default" size="sm">Draft</Badge>
                )}
              </div>
              
              {/* Hover sweep */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          )
        })}
        
        {filteredContent.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 glass rounded-xl border border-white/10">
            No content found matching your filters.
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
