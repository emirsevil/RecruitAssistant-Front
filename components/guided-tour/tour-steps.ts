export interface TourStep {
  /** Route where this step's target lives */
  route: string
  /** Value of data-tour attribute on the target element. Null = centered card (no spotlight) */
  target: string | null
  /** Step title (English) */
  title: string
  /** Step title (Turkish) */
  titleTr: string
  /** Step description (English) */
  description: string
  /** Step description (Turkish) */
  descriptionTr: string
  /** Preferred tooltip placement relative to the target */
  placement?: "top" | "bottom" | "left" | "right"
  /** CTA buttons shown on the final step */
  ctas?: { label: string; labelTr: string; href: string }[]
}

export const TOUR_STEPS: TourStep[] = [
  // ── Dashboard (steps 0–3) ────────────────────────────────────────
  {
    route: "/dashboard",
    target: "dashboard-header",
    title: "Welcome to RecruitAssistant!",
    titleTr: "RecruitAssistant'a Hoş Geldiniz!",
    description:
      "This is your Dashboard — the main hub. Here you'll see your readiness score, weekly goals, personalized recommendations, and upcoming events all in one place.",
    descriptionTr:
      "Burası Dashboard'unuz — ana merkeziniz. Hazırlık puanınızı, haftalık hedeflerinizi, size özel önerileri ve yaklaşan etkinlikleri tek bir yerde göreceksiniz.",
    placement: "bottom",
  },
  {
    route: "/dashboard",
    target: "dashboard-readiness",
    title: "Your Readiness Score",
    titleTr: "Hazırlık Puanınız",
    description:
      "This card shows your overall readiness percentage, calculated from your interview scores, quiz performance, and CV quality. Watch it grow as you practice!",
    descriptionTr:
      "Bu kart, mülakat puanlarınız, quiz performansınız ve CV kalitenizden hesaplanan genel hazırlık yüzdenizi gösterir. Pratik yaptıkça yükselişini izleyin!",
    placement: "bottom",
  },
  {
    route: "/dashboard",
    target: "dashboard-actions",
    title: "Recommended Actions",
    titleTr: "Önerilen Adımlar",
    description:
      "Personalized suggestions for what to work on next. Click any card to jump straight into an interview, quiz, or CV improvement.",
    descriptionTr:
      "Sıradaki çalışmanız için kişiselleştirilmiş öneriler. Herhangi bir karta tıklayarak doğrudan mülakata, quize veya CV iyileştirmeye geçin.",
    placement: "bottom",
  },
  {
    route: "/dashboard",
    target: "nav-sidebar",
    title: "Navigation Sidebar",
    titleTr: "Gezinme Menüsü",
    description:
      "Use this sidebar to navigate between features: Dashboard, Mock Interview, Quizzes, CV Studio, Analytics, and Settings. Your active workspace is shown at the top.",
    descriptionTr:
      "Bu menüyü kullanarak özellikler arasında gezinin: Dashboard, Mock Mülakat, Quizler, CV Stüdyosu, Analitik ve Ayarlar. Aktif çalışma alanınız en üstte görünür.",
    placement: "right",
  },

  // ── CV Studio (steps 4–6) ────────────────────────────────────────
  {
    route: "/cv-studio",
    target: "cv-header",
    title: "CV Studio",
    titleTr: "CV Stüdyosu",
    description:
      "This is where you build, edit, and polish your CV. Fill in your personal info, experience, education, and projects — or upload an existing resume to get started fast.",
    descriptionTr:
      "CV'nizi oluşturacağınız, düzenleyeceğiniz ve cilaladığınız yer burası. Kişisel bilgilerinizi, deneyimlerinizi, eğitiminizi ve projelerinizi doldurun — veya hızlı başlamak için mevcut CV'nizi yükleyin.",
    placement: "bottom",
  },
  {
    route: "/cv-studio",
    target: "cv-upload",
    title: "Upload Your Resume",
    titleTr: "CV'nizi Yükleyin",
    description:
      "Upload a PDF or DOCX resume and we'll automatically parse it into the form fields. You can then tweak details before generating a polished version.",
    descriptionTr:
      "PDF veya DOCX formatında CV yükleyin, biz otomatik olarak form alanlarına dönüştürelim. Ardından cilalanmış bir versiyon oluşturmadan önce detayları düzenleyebilirsiniz.",
    placement: "left",
  },
  {
    route: "/cv-studio",
    target: "cv-generate-btn",
    title: "Generate with AI",
    titleTr: "Yapay Zeka ile Oluştur",
    description:
      "Once your details are in, click here to generate a professionally formatted, ATS-optimized CV tailored to your active workspace's job description.",
    descriptionTr:
      "Bilgilerinizi girdikten sonra, aktif çalışma alanınızdaki iş tanımına uygun, profesyonel formatta, ATS uyumlu bir CV oluşturmak için buraya tıklayın.",
    placement: "left",
  },

  // ── Quizzes (steps 7–8) ─────────────────────────────────────────
  {
    route: "/quizzes",
    target: "quizzes-header",
    title: "Test Your Knowledge",
    titleTr: "Bilginizi Test Edin",
    description:
      "Quizzes help you practice weak areas and prepare for technical or role-specific questions. They're generated from your job description topics.",
    descriptionTr:
      "Quizler zayıf alanlarınızda pratik yapmanıza ve teknik veya role özel sorulara hazırlanmanıza yardımcı olur. İş tanımınızdaki konulardan üretilirler.",
    placement: "bottom",
  },
  {
    route: "/quizzes",
    target: "quizzes-topics",
    title: "Your Topics",
    titleTr: "Konularınız",
    description:
      "These are skills extracted from your job description. Select a difficulty for any topic, click 'Generate quiz,' and test yourself. You can also add custom topics.",
    descriptionTr:
      "Bunlar iş tanımınızdan çıkarılan yeteneklerdir. Herhangi bir konu için zorluk seçin, 'Quiz oluştur'a tıklayın ve kendinizi test edin. Özel konular da ekleyebilirsiniz.",
    placement: "bottom",
  },

  // ── Mock Interview (steps 9–10) ───────────────────────────────────
  {
    route: "/mock-interview",
    target: "interview-setup",
    title: "Configure Your Interview",
    titleTr: "Mülakatınızı Yapılandırın",
    description:
      "Choose between HR/Behavioral or Technical interview types, set the difficulty level, and pick specific topics. Your active workspace context is used automatically.",
    descriptionTr:
      "İK/Davranışsal veya Teknik mülakat türleri arasında seçim yapın, zorluk seviyesini belirleyin ve belirli konuları seçin. Aktif çalışma alanı bağlamınız otomatik olarak kullanılır.",
    placement: "bottom",
  },
  {
    route: "/mock-interview",
    target: "interview-start-btn",
    title: "Start Interview",
    titleTr: "Mülakatı Başlat",
    description:
      "Hit this button to begin a live AI-powered interview session. You can answer by voice or text, and you'll receive detailed feedback and scores when it's done.",
    descriptionTr:
      "Canlı bir yapay zeka destekli mülakat oturumu başlatmak için bu düğmeye basın. Sesli veya yazılı yanıt verebilir, bittiğinde detaylı geri bildirim ve puanlarınızı alabilirsiniz.",
    placement: "top",
  },

  // ── Analytics (steps 11–12) ──────────────────────────────────────
  {
    route: "/analytics",
    target: "analytics-header",
    title: "Analytics & Progress",
    titleTr: "Analitik & İlerleme",
    description:
      "Track your performance over time with detailed charts, topic breakdowns, quiz stats, and AI-generated insights. Use the time range selector to compare periods.",
    descriptionTr:
      "Detaylı grafikler, konu dağılımları, quiz istatistikleri ve yapay zeka içgörüleriyle performansınızı zaman içinde takip edin. Dönemleri karşılaştırmak için zaman aralığı seçiciyi kullanın.",
    placement: "bottom",
  },
  {
    route: "/analytics",
    target: "analytics-kpis",
    title: "Key Metrics",
    titleTr: "Temel Metrikler",
    description:
      "Your total interviews, average scores, quiz count, and quiz accuracy — all at a glance. The trend indicators show how you're improving compared to the previous period.",
    descriptionTr:
      "Toplam mülakatlarınız, ortalama puanlarınız, quiz sayısı ve quiz doğruluğu — hepsi bir bakışta. Trend göstergeleri önceki döneme göre ne kadar geliştiğinizi gösterir.",
    placement: "bottom",
  },

  // ── Settings (step 13) ───────────────────────────────────────────
  {
    route: "/settings",
    target: "settings-tour-card",
    title: "Replay This Tour",
    titleTr: "Turu Tekrar Oynat",
    description:
      "Whenever you want to revisit this walkthrough, come to Settings and click 'Replay onboarding tour.' It will restart the guided tour from the beginning.",
    descriptionTr:
      "Bu tanıtım turunu tekrar izlemek istediğinizde Ayarlar'a gelin ve 'Turu tekrar başlat' düğmesine tıklayın. Rehber tur baştan başlayacaktır.",
    placement: "top",
  },

  // ── Final (step 14) — centered, no target ────────────────────────
  {
    route: "/settings",
    target: null,
    title: "You're All Set! 🎉",
    titleTr: "Hazırsınız! 🎉",
    description:
      "That's the full tour! You're ready to start preparing for your next opportunity. Pick an action below to jump right in.",
    descriptionTr:
      "Tur tamamlandı! Bir sonraki fırsatınıza hazırlanmaya başlayabilirsiniz. Hemen başlamak için aşağıdan bir eylem seçin.",
    ctas: [
      { label: "Go to Dashboard", labelTr: "Dashboard'a Git", href: "/dashboard" },
      { label: "Create CV", labelTr: "CV Oluştur", href: "/cv-studio" },
      { label: "Mock Interview", labelTr: "Mock Mülakat", href: "/mock-interview" },
      { label: "Take a Quiz", labelTr: "Quiz Çöz", href: "/quizzes" },
    ],
  },
]
