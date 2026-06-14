const fs = require('fs');

const path = '/Users/denizozturk/Desktop/RecruitAssistant-Fron/lib/language-context.tsx';
let content = fs.readFileSync(path, 'utf8');

const enAdditions = {
  "Turkish": "Turkish",
  "LinkedIn URL": "LinkedIn URL",
  "GitHub/Portfolio URL": "GitHub/Portfolio URL",
  "Project Date": "Project Date",
  "Reset password": "Reset password",
  "Enter your new password below": "Enter your new password below",
  "New Password": "New Password",
  "Confirm New Password": "Confirm New Password",
  "Re-enter your password": "Re-enter your password",
  "Password must contain:": "Password must contain:",
  "One uppercase letter": "One uppercase letter",
  "One number": "One number",
  "Resetting...": "Resetting...",
  "Reset Password": "Reset Password",
  "Back to login": "Back to login",
  "Passwords do not match": "Passwords do not match",
  "Password must be at least 8 characters": "Password must be at least 8 characters",
  "Password reset successful!": "Password reset successful!",
  "Full Name": "Full Name",
  "University": "University",
  "Graduation Year": "Graduation Year",
  "Target Role": "Target Role",
  "Your Profile": "Your Profile",
  "Name:": "Name:",
  "University:": "University:",
  "Graduation:": "Graduation:",
  "Target Role:": "Target Role:",
  "Not provided": "Not provided",
  "Selected Skills": "Selected Skills",
  "Your Goals": "Your Goals",
  "Attempt #": "Attempt #",
  "pts": "pts",
  "Loading...": "Loading...",
  "Your account has been created successfully! You can now log in.": "Your account has been created successfully! You can now log in.",
  "CV Language": "CV Language"
};

const trAdditions = {
  "Turkish": "Türkçe",
  "LinkedIn URL": "LinkedIn URL",
  "GitHub/Portfolio URL": "GitHub/Portfolyo URL",
  "Project Date": "Proje Tarihi",
  "Reset password": "Şifreyi sıfırla",
  "Enter your new password below": "Yeni şifrenizi aşağıya girin",
  "New Password": "Yeni Şifre",
  "Confirm New Password": "Yeni Şifreyi Onayla",
  "Re-enter your password": "Şifrenizi tekrar girin",
  "Password must contain:": "Şifreniz şunları içermelidir:",
  "One uppercase letter": "Bir büyük harf",
  "One number": "Bir rakam",
  "Resetting...": "Sıfırlanıyor...",
  "Reset Password": "Şifreyi Sıfırla",
  "Back to login": "Giriş yap'a dön",
  "Passwords do not match": "Şifreler eşleşmiyor",
  "Password must be at least 8 characters": "Şifre en az 8 karakter olmalıdır",
  "Password reset successful!": "Şifre sıfırlama başarılı!",
  "Full Name": "Ad Soyad",
  "University": "Üniversite",
  "Graduation Year": "Mezuniyet Yılı",
  "Target Role": "Hedef Rol",
  "Your Profile": "Profiliniz",
  "Name:": "Ad:",
  "University:": "Üniversite:",
  "Graduation:": "Mezuniyet:",
  "Target Role:": "Hedef Rol:",
  "Not provided": "Belirtilmedi",
  "Selected Skills": "Seçilen Yetenekler",
  "Your Goals": "Hedefleriniz",
  "Attempt #": "Deneme #",
  "pts": "puan",
  "Loading...": "Yükleniyor...",
  "Your account has been created successfully! You can now log in.": "Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.",
  "CV Language": "CV Dili"
};

// Insert into English block
const insertEn = Object.entries(enAdditions)
  .filter(([key]) => !content.includes(`"${key}":`))
  .map(([key, val]) => `        "${key}": "${val}",`)
  .join("\\n");

if (insertEn) {
  content = content.replace(/\\s+Delete Account": "Delete Account",/, '$&\\n        // Newly Added\\n' + insertEn);
}

// Insert into Turkish block
const insertTr = Object.entries(trAdditions)
  .filter(([key]) => !content.includes(`"${key}":`) || content.indexOf(`"${key}":`) === content.lastIndexOf(`"${key}":`)) 
  // It's a bit tricky to safely check TR object, but we'll inject at the bottom of the TR object before the final closing brace of transitions definition.
  .map(([key, val]) => `        "${key}": "${val}",`)
  .join("\\n");

if (insertTr) {
  content = content.replace(/\\s+"Compilation Failed": "Derleme Başarısız",/, '$&\\n        // Newly Added\\n' + insertTr);
}

fs.writeFileSync(path, content, 'utf8');
