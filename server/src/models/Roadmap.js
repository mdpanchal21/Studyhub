import mongoose from 'mongoose'

const roadmapTaskSchema = new mongoose.Schema({
  day: { type: String, required: true },
  title: { type: String, required: true },
  details: { type: String, default: '' },
  completed: { type: Boolean, default: false },
}, { _id: false })

const roadmapWeekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  theme: { type: String, required: true },
  focus: { type: String, default: '' },
  tasks: { type: [roadmapTaskSchema], default: [] },
}, { _id: false })

const roadmapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  targetRole: { type: String, required: true, trim: true },
  currentLevel: { type: String, default: 'beginner', trim: true },
  hoursPerDay: { type: Number, default: 2 },
  durationWeeks: { type: Number, default: 4 },
  targetDate: { type: Date, default: null },
  knownTopics: { type: [String], default: [] },
  weakTopics: { type: [String], default: [] },
  plan: { type: [roadmapWeekSchema], default: [] },
  summary: { type: String, default: '' },
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  progress: {
    completedTasks: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
  },
}, { timestamps: true })

export default mongoose.model('Roadmap', roadmapSchema)