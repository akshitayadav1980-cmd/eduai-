# Pydantic response schemas for the vernacular_ai API.

from app.schemas.auth import (
    LoginRequest,
    LogoutResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.translation import (
    LanguagePair,
    SupportedLanguagesResponse,
    TranslationMatch,
    TranslationRequest,
    TranslationResponse,
)
from app.schemas.tutor import (
    ChatMessage,
    CreateSessionRequest,
    SessionResponse,
    TutorChatRequest,
    TutorChatResponse,
)
from app.schemas.quiz import (
    AnswerSubmission,
    GenerateQuizRequest,
    GenerateQuizResponse,
    QuestionEvaluationItem,
    QuestionResult,
    QuizEvaluateRequest,
    QuizEvaluateResponse,
    QuizQuestionPublic,
)
from app.schemas.progress import (
    ActivityResponse,
    RecordActivityRequest,
    StudentListProgressResponse,
    StudentProgressListItem,
    StudentProgressSummary,
)
from app.schemas.vocabulary import (
    CategoryResponse,
    LanguageResponse,
    PaginationMeta,
    VocabularyEntryResponse,
    VocabularyListResponse,
)

__all__ = [
    # auth
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "LogoutResponse",
    # vocabulary / language
    "LanguageResponse",
    "CategoryResponse",
    "VocabularyEntryResponse",
    "PaginationMeta",
    "VocabularyListResponse",
    # translation
    "TranslationRequest",
    "TranslationResponse",
    "TranslationMatch",
    "LanguagePair",
    "SupportedLanguagesResponse",
    # tutor
    "ChatMessage",
    "CreateSessionRequest",
    "SessionResponse",
    "TutorChatRequest",
    "TutorChatResponse",
    # quiz
    "QuizQuestionPublic",
    "QuestionEvaluationItem",
    "GenerateQuizRequest",
    "GenerateQuizResponse",
    "AnswerSubmission",
    "QuizEvaluateRequest",
    "QuestionResult",
    "QuizEvaluateResponse",
    # progress
    "RecordActivityRequest",
    "ActivityResponse",
    "StudentProgressSummary",
    "StudentProgressListItem",
    "StudentListProgressResponse",
]


