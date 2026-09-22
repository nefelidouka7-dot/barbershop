import type { Locale } from "./config";

const el = {
  meta: {
    description: "Κλείστε το επόμενο κούρεμά σας με τους barbers μας.",
  },
  nav: {
    menu: "Μενού",
    barbers: "Barbers",
    visit: "Επίσκεψη",
    account: "Λογαριασμός",
    book: "Κράτηση",
  },
  footer: {
    blurb:
      "Κλασικό κούρεμα σε ήρεμο χώρο, με καθαρές γραμμές. Walk-in όταν γίνεται — κράτηση προτιμότερη.",
    explore: "Πλοήγηση",
    services: "Υπηρεσίες",
    barbers: "Barbers",
    book: "Κράτηση",
    account: "Λογαριασμός",
    staff: "Προσωπικό",
    contact: "Επικοινωνία",
    hoursShort: "Τρ–Σάβ · από 09:00",
    address: "Μαρκ. Μπότσαρη 98, Θεσσαλονίκη 546 44",
  },
  lang: {
    label: "Γλώσσα",
    el: "ΕΛ",
    en: "EN",
  },
  home: {
    heroAlt: "Εσωτερικό κουρείου",
    heroTagline:
      "Ένα σύγχρονο barber shop με street αισθητική, που συνδυάζει τα κλασικά αλλά και μοντέρνα χαρακτηριστικά ενός κουρείου.",
    heroLine1: "Ένα σύγχρονο barber shop",
    heroLine2: "με street αισθητική,",
    heroLine3:
      "που συνδυάζει τα κλασικά αλλά και μοντέρνα χαρακτηριστικά ενός κουρείου.",
    bookAppointment: "Κλείστε ραντεβού",
    exploreCraft: "Δείτε τη δουλειά",
    scroll: "Κύλιση",
    craftEyebrow: "Η τέχνη",
    craftTitle1: "Αργά χέρια.",
    craftTitle2: "Καθαρές γραμμές.",
    craftBody:
      "Κάθε επίσκεψη ξεκινά το ίδιο: συζήτηση, συμβουλή, μετά η χωρίς βιασύνη δουλειά με ψαλίδι, μηχανή και ξυράφι. Χωρίς βιασύνη. Χωρίς θόρυβο για τον θόρυβο.",
    craftAlt: "Barber στη δουλειά",
    atmosphereAlt: "Εργαλεία και ατμόσφαιρα",
    atmosphereLine: "Ένας χώρος φτιαγμένος για το κούρεμα — ξύλο, ατσάλι και ζεστό φως.",
    menuEyebrow: "Μενού",
    servicesTitle: "Τι προσφέρουμε",
    servicesBody:
      "Απλές υπηρεσίες, δίκαιες τιμές. Online κράτηση σε λιγότερο από ένα λεπτό.",
    minutes: "λεπτά",
    chooseService: "Επιλέξτε υπηρεσία",
    teamEyebrow: "Η ομάδα",
    teamTitle: "Η καρέκλα είναι έτοιμη",
    teamBody:
      "Διαλέξτε τον barber που ξέρει το look σας — ή γνωρίστε κάποιον νέο.",
    bookWith: "Κράτηση με",
    visitEyebrow: "Επίσκεψη",
    visitTitle: "Βρείτε το μαγαζί",
    visitBody:
      "Walk-in όταν μπορούμε. Κράτηση προτιμότερη — ειδικά βράδια και Σάββατα.",
    addressLabel: "Διεύθυνση",
    addressValue: "Μαρκ. Μπότσαρη 98, Θεσσαλονίκη 546 44",
    addressLine1: "Μαρκ. Μπότσαρη 98",
    addressLine2: "Θεσσαλονίκη 546 44",
    hoursLabel: "Ωράριο",
    hoursSchedule: [
      { day: "Δευτέρα", time: "Κλειστά" },
      { day: "Τρίτη", time: "09:00–14:00 · 17:00–21:00" },
      { day: "Τετάρτη", time: "09:00–14:30" },
      { day: "Πέμπτη", time: "09:00–14:00 · 17:00–20:00" },
      { day: "Παρασκευή", time: "09:00–14:00 · 17:00–21:00" },
      { day: "Σάββατο", time: "09:00–15:00" },
      { day: "Κυριακή", time: "Κλειστά" },
    ],
    phoneLabel: "Τηλέφωνο",
    visitAlt: "Ατμόσφαιρα καταστήματος",
    ctaTitle: "Το επόμενο κούρεμα ξεκινά με μια ώρα που σας βολεύει.",
    ctaBody:
      "Διαλέξτε barber, υπηρεσία και slot. Θα είμαστε έτοιμοι όταν μπείτε.",
    bookNow: "Κράτηση τώρα",
  },
  book: {
    title: "Κλείστε ραντεβού",
    subtitle:
      "Ακολουθήστε τα βήματα για να κλείσετε το ραντεβού σας σε λίγα λεπτά.",
    stepBarber: "Barber",
    stepService: "Υπηρεσία",
    stepDatetime: "Ημέρα / ώρα",
    stepDetails: "Στοιχεία",
    pickBarberTitle: "Επιλέξτε με ποιον θέλετε να κουρευτείτε",
    pickBarberDesc:
      "Διαλέξτε τον barber που προτιμάτε — μετά θα επιλέξετε υπηρεσία και ώρα.",
    pickServiceTitle: "Επιλέξτε υπηρεσία",
    pickServiceDesc: "Τι θέλετε να κάνετε με τον {name}; Διαλέξτε διάρκεια και τιμή.",
    noServicesTitle: "Δεν υπάρχουν υπηρεσίες για αυτόν τον barber",
    noServicesDesc: "Δοκιμάστε άλλον barber.",
    minutes: "λεπτά",
    pickDatetimeTitle: "Επιλέξτε ημέρα και ώρα",
    pickDatetimeDesc:
      "{service} με {barber} · {minutes} λεπτά · {price}. Διαλέξτε ημερομηνία και διαθέσιμο slot.",
    availableTimes: "Διαθέσιμες ώρες",
    loadingTimes: "Φόρτωση ωρών",
    noSlotsTitle: "Δεν υπάρχουν διαθέσιμα slots αυτή την ημέρα",
    noSlotsDesc: "Δοκιμάστε άλλη ημερομηνία ή άλλον barber.",
    continue: "Συνέχεια",
    detailsTitle: "Συμπληρώστε τα στοιχεία σας",
    detailsDesc:
      "Χρειάζεται μόνο το τηλέφωνο. Το email είναι προαιρετικό για επιβεβαίωση.",
    nameOptional: "Όνομα (προαιρετικό)",
    phone: "Τηλέφωνο",
    emailOptional: "Email (προαιρετικό)",
    confirm: "Επιβεβαίωση ραντεβού",
    doneTitle: "Το ραντεβού κλείστηκε",
    bookingCode: "Κωδ.",
    backHome: "Επιστροφή στην αρχική",
    back: "← Πίσω",
    toastBarbersError: "Σφάλμα φόρτωσης barbers",
    toastSupabaseUnreachable: "Δεν υπήρξε σύνδεση με το Supabase",
    toastUsingDemoBarbers: "Χρησιμοποιούνται demo barbers",
    toastServicesFailed: "Αποτυχία φόρτωσης υπηρεσιών",
    toastUsingDemoServices: "Χρησιμοποιούνται demo υπηρεσίες",
    toastSlotsFailed: "Δεν φορτώθηκαν οι ώρες",
    toastTryOtherDate: "Δοκιμάστε άλλη ημερομηνία.",
    toastBooked: "Κλείστηκε",
    toastDemoBooked: "Demo κράτηση αποθηκεύτηκε τοπικά",
    toastDemoHint: "Συνδέστε το Supabase για πραγματικά ραντεβού.",
    toastConfirmSent: "Στάλθηκε επιβεβαίωση αν δόθηκε email.",
    toastCouldNotBook: "Δεν έγινε η κράτηση",
    toastTryOtherSlot: "Δοκιμάστε άλλο slot",
  },
  account: {
    title: "Ο λογαριασμός σας",
    subtitle:
      "Οι κρατήσεις ως επισκέπτης γίνονται χωρίς λογαριασμό. Συνδεθείτε για να δείτε, ακυρώσετε ή αλλάξετε ραντεβού.",
    email: "Email",
    emailPlaceholder: "you@email.com",
    sendMagic: "Αποστολή magic link",
    checkInbox: "Ελέγξτε τα εισερχόμενά σας",
    orBookGuest: "Ή",
    bookAsGuest: "κλείστε ως επισκέπτης",
    signOut: "Αποσύνδεση",
    noBookings: "Δεν βρέθηκαν κρατήσεις για αυτό το email",
    reschedule: "Αλλαγή",
    cancel: "Ακύρωση",
    pickNewTime: "Επιλέξτε νέα ώρα",
    confirmNewTime: "Επιβεβαίωση νέας ώρας",
    close: "Κλείσιμο",
    toastFailed: "Αποτυχία",
    toastCancelFailed: "Δεν ακυρώθηκε",
    toastCancelled: "Ακυρώθηκε",
    toastRescheduleFailed: "Η αλλαγή απέτυχε",
    toastRescheduled: "Άλλαξε",
  },
  reset: {
    title: "Νέος κωδικός",
    subtitle: "Ορίστε νέο κωδικό για τον λογαριασμό σας.",
    password: "Νέος κωδικός",
    confirm: "Επιβεβαίωση",
    save: "Αποθήκευση",
    mismatch: "Οι κωδικοί δεν ταιριάζουν",
    tooShort: "Τουλάχιστον 6 χαρακτήρες",
    invalid: "Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει. Ζητήστε νέο reset.",
    success: "Ο κωδικός άλλαξε",
  },
  calendar: {
    weekdays: ["Δε", "Τρ", "Τε", "Πε", "Πα", "Σα", "Κυ"],
    selected: "Επιλεγμένη",
    prevMonth: "Προηγούμενος μήνας",
    nextMonth: "Επόμενος μήνας",
  },
  validation: {
    nameShort: "Το όνομα είναι πολύ μικρό",
    emailInvalid: "Απαιτείται έγκυρο email",
    phoneInvalid: "Απαιτείται έγκυρο τηλέφωνο",
  },
  content: {
    services: {
      Haircut: "Κούρεμα",
      "Haircut + Beard": "Κούρεμα + Γένια",
      "Beard Trim": "Περιποίηση γενιών",
      "Hot Towel Shave": "Ξύρισμα με ζεστή πετσέτα",
    } as Record<string, string>,
    bios: {
      "Cuts, fades, and clean finishes.":
        "Κουρέματα, fades και καθαρές γραμμές.",
      "Beards, trims, and classic shaves.":
        "Γένια, περιποίηση και κλασικά ξυρίσματα.",
      "Classic and modern cuts.":
        "Κλασικά και μοντέρνα κουρέματα.",
      "Fades, styling, and clean lines.":
        "Fades, styling και καθαρές γραμμές.",
    } as Record<string, string>,
  },
};

export type Dictionary = typeof el;

const en: Dictionary = {
  meta: {
    description: "Book your next cut with our barbers.",
  },
  nav: {
    menu: "Menu",
    barbers: "Barbers",
    visit: "Visit",
    account: "Account",
    book: "Book",
  },
  footer: {
    blurb:
      "Classic barbering with a calm room and a sharp edge. Walk-ins welcome, bookings preferred.",
    explore: "Explore",
    services: "Services",
    barbers: "Barbers",
    book: "Book",
    account: "Account",
    staff: "Staff",
    contact: "Contact",
    hoursShort: "Tue–Sat · from 09:00",
    address: "Mark. Botsari 98, Thessaloniki 546 44",
  },
  lang: {
    label: "Language",
    el: "ΕΛ",
    en: "EN",
  },
  home: {
    heroAlt: "Barber shop interior",
    heroTagline:
      "A modern barber shop with street aesthetic, blending classic and contemporary barbering.",
    heroLine1: "A modern barber shop",
    heroLine2: "with street aesthetic,",
    heroLine3:
      "blending classic and contemporary barbering.",
    bookAppointment: "Book an appointment",
    exploreCraft: "Explore the craft",
    scroll: "Scroll",
    craftEyebrow: "The craft",
    craftTitle1: "Slow hands.",
    craftTitle2: "Sharp lines.",
    craftBody:
      "Every visit starts the same way: a conversation, a consultation, then the unhurried work of scissors, clippers, and steel. No rush. No noise for the sake of noise.",
    craftAlt: "Barber at work",
    atmosphereAlt: "Tools and atmosphere",
    atmosphereLine: "A room built for the cut — wood, steel, and warm light.",
    menuEyebrow: "Menu",
    servicesTitle: "What we offer",
    servicesBody:
      "Straightforward services, fair prices. Book online in under a minute.",
    minutes: "minutes",
    chooseService: "Choose a service",
    teamEyebrow: "The team",
    teamTitle: "The chair is ready",
    teamBody: "Pick the barber who knows your look — or meet someone new.",
    bookWith: "Book with",
    visitEyebrow: "Visit",
    visitTitle: "Find the shop",
    visitBody:
      "Walk-ins when we can. Bookings preferred — especially evenings and Saturdays.",
    addressLabel: "Address",
    addressValue: "Mark. Botsari 98, Thessaloniki 546 44",
    addressLine1: "Mark. Botsari 98",
    addressLine2: "Thessaloniki 546 44",
    hoursLabel: "Hours",
    hoursSchedule: [
      { day: "Monday", time: "Closed" },
      { day: "Tuesday", time: "09:00–14:00 · 17:00–21:00" },
      { day: "Wednesday", time: "09:00–14:30" },
      { day: "Thursday", time: "09:00–14:00 · 17:00–20:00" },
      { day: "Friday", time: "09:00–14:00 · 17:00–21:00" },
      { day: "Saturday", time: "09:00–15:00" },
      { day: "Sunday", time: "Closed" },
    ],
    phoneLabel: "Phone",
    visitAlt: "Shop exterior mood",
    ctaTitle: "Your next cut starts with a time that works.",
    ctaBody:
      "Pick a barber, choose a service, lock a slot. We'll be ready when you walk in.",
    bookNow: "Book now",
  },
  book: {
    title: "Book an appointment",
    subtitle: "Follow the steps to lock in your visit in a few minutes.",
    stepBarber: "Barber",
    stepService: "Service",
    stepDatetime: "Day / time",
    stepDetails: "Details",
    pickBarberTitle: "Choose who you’d like to cut your hair",
    pickBarberDesc:
      "Pick your preferred barber — then choose a service and time.",
    pickServiceTitle: "Choose a service",
    pickServiceDesc: "What would you like with {name}? Pick duration and price.",
    noServicesTitle: "No services for this barber",
    noServicesDesc: "Try another barber.",
    minutes: "minutes",
    pickDatetimeTitle: "Choose a day and time",
    pickDatetimeDesc:
      "{service} with {barber} · {minutes} min · {price}. Pick a date and available slot.",
    availableTimes: "Available times",
    loadingTimes: "Loading times",
    noSlotsTitle: "No slots available on this day",
    noSlotsDesc: "Try another date or barber.",
    continue: "Continue",
    detailsTitle: "Your details",
    detailsDesc:
      "Phone is required. Email is optional for confirmation.",
    nameOptional: "Name (optional)",
    phone: "Phone",
    emailOptional: "Email (optional)",
    confirm: "Confirm booking",
    doneTitle: "You’re booked",
    bookingCode: "Ref.",
    backHome: "Back to home",
    back: "← Back",
    toastBarbersError: "Barbers load error",
    toastSupabaseUnreachable: "Could not reach Supabase",
    toastUsingDemoBarbers: "Using demo barbers",
    toastServicesFailed: "Services load failed",
    toastUsingDemoServices: "Using demo services",
    toastSlotsFailed: "Could not load slots",
    toastTryOtherDate: "Try another date.",
    toastBooked: "Booked",
    toastDemoBooked: "Demo booking saved locally",
    toastDemoHint: "Connect Supabase to save real appointments.",
    toastConfirmSent: "Confirmation sent if email was provided.",
    toastCouldNotBook: "Could not book",
    toastTryOtherSlot: "Try another slot",
  },
  account: {
    title: "Your account",
    subtitle:
      "Guest bookings work without an account. Sign in to view, cancel, or reschedule.",
    email: "Email",
    emailPlaceholder: "you@email.com",
    sendMagic: "Send magic link",
    checkInbox: "Check your inbox",
    orBookGuest: "Or",
    bookAsGuest: "book as guest",
    signOut: "Sign out",
    noBookings: "No bookings found for this email",
    reschedule: "Reschedule",
    cancel: "Cancel",
    pickNewTime: "Pick a new time",
    confirmNewTime: "Confirm new time",
    close: "Close",
    toastFailed: "Failed",
    toastCancelFailed: "Could not cancel",
    toastCancelled: "Cancelled",
    toastRescheduleFailed: "Reschedule failed",
    toastRescheduled: "Rescheduled",
  },
  reset: {
    title: "New password",
    subtitle: "Set a new password for your account.",
    password: "New password",
    confirm: "Confirm password",
    save: "Save",
    mismatch: "Passwords do not match",
    tooShort: "At least 6 characters",
    invalid: "This link is invalid or expired. Request a new reset.",
    success: "Password updated",
  },
  calendar: {
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    selected: "Selected",
    prevMonth: "Previous month",
    nextMonth: "Next month",
  },
  validation: {
    nameShort: "Name is too short",
    emailInvalid: "Valid email required",
    phoneInvalid: "Valid phone required",
  },
  content: {
    services: {
      Haircut: "Haircut",
      "Haircut + Beard": "Haircut + Beard",
      "Beard Trim": "Beard Trim",
      "Hot Towel Shave": "Hot Towel Shave",
    },
    bios: {
      "Cuts, fades, and clean finishes.":
        "Cuts, fades, and clean finishes.",
      "Beards, trims, and classic shaves.":
        "Beards, trims, and classic shaves.",
      "Classic and modern cuts.": "Classic and modern cuts.",
      "Fades, styling, and clean lines.":
        "Fades, styling, and clean lines.",
    },
  },
};

const dictionaries: Record<Locale, Dictionary> = { el, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.el;
}

export function translateServiceName(
  name: string,
  locale: Locale,
  dict?: Dictionary
): string {
  const d = dict ?? getDictionary(locale);
  if (locale === "en") return name;
  return d.content.services[name] ?? name;
}

export function translateBio(
  bio: string | null | undefined,
  locale: Locale,
  dict?: Dictionary
): string {
  if (!bio) return "";
  const d = dict ?? getDictionary(locale);
  if (locale === "en") return bio;
  return d.content.bios[bio] ?? bio;
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`
  );
}
