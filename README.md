# 🌐 Vernacular AI

### AI-Powered Vernacular Pedagogy and Real-Time Translation Tool for Mother Tongue-Based Primary Education

> **Bridging the language gap in education through AI-powered translation, adaptive learning, and vernacular-first pedagogy.**

Vernacular AI is an AI-powered educational platform designed to support **mother-tongue-based primary education**, particularly in rural and low-resource classroom environments.

The platform enables students to interact with educational content in their preferred language while helping teachers manage learners, monitor learning activities, and provide more personalized instruction.

---

## 🎯 Problem Statement

Language can become a major barrier to effective learning when students are taught primarily in a language different from their mother tongue.

This challenge is particularly significant in rural and multilingual educational environments where:

- Students may understand concepts better in their native language.
- Teachers may not be fluent in every student's mother tongue.
- Educational resources are often unavailable in regional languages.
- Students may have limited access to personal digital devices.
- Translation tools often focus on general-purpose translation rather than educational context.

### The Goal

Vernacular AI aims to make learning more accessible by combining:

**Mother-tongue learning + AI translation + contextual tutoring + teacher support**

---

# 💡 Our Solution

Vernacular AI provides a unified educational environment where:

### 👨🎓 Students can

- Select their preferred language.
- Translate educational content between supported languages.
- Ask questions using natural language.
- Interact with an AI tutor.
- Receive contextual educational responses.
- Practice through AI-generated quizzes.
- Use voice-based interaction where supported.
- Access learning through a shared classroom screen.

### 👩🏫 Teachers can

- Manage student information.
- View learner-related information.
- Support multilingual classrooms.
- Use AI-assisted educational tools.
- Provide more personalized learning experiences.

---

# ✨ Key Features

| Feature | Description |
|---|---|
| 🌍 Vernacular Translation | Translate educational content between supported languages |
| 🤖 AI Tutor | Ask questions and receive AI-assisted educational guidance |
| 🧠 Context-Aware Responses | Uses educational context and retrieved knowledge to improve responses |
| 📚 RAG Pipeline | Retrieval-Augmented Generation for grounded educational responses |
| 📖 Dictionary-First Translation | Uses curated vocabulary before falling back to LLM translation |
| 📝 AI Quiz Generation | Generate educational quizzes dynamically |
| 🎯 Quiz Evaluation | Deterministic scoring for generated quizzes |
| 🔊 Text-to-Speech | Voice output for supported languages |
| 🎙️ Speech-to-Text | Voice input using speech recognition |
| 👨🏫 Teacher Mode | Teacher-focused classroom functionality |
| 👨🎓 Student Mode | Student-focused learning interface |
| 🔐 Authentication | JWT-based authentication |
| 📈 Learning Foundation | Architecture prepared for learning progress and recommendations |
| 🎨 Modern UI | Responsive React interface with cinematic visual experience |

---

# 🌐 Supported Languages

The current language dataset includes:

- 🇮🇳 **Kurukh**
- 🇮🇳 **Hindi**
- 🇬🇧 **English**

The architecture is designed to support additional languages in the future.

---

# 🧠 AI Architecture

Vernacular AI combines multiple AI techniques rather than relying on a single model.

```text
                    User Input
                        │
                        ▼
              ┌──────────────────┐
              │ Input Processing │
              └────────┬─────────┘
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
       Translation           AI Question
             │                   │
             ▼                   ▼
     Dictionary Layer       Retrieval Layer
             │                   │
             │                   ▼
             │              Knowledge Base
             │                   │
             │                   ▼
             │              RAG Context
             │                   │
             └─────────┬─────────┘
                       ▼
                 LLM Processing
                       │
                       ▼
                Response Generation
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
         Text Output        Voice Output
```
