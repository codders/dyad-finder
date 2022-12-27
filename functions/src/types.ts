interface PreferenceRecord {
  student_prefs: { [key: string]: string[] }[]
}

interface TripleAssignment {
  matching: [ string, string, string][],
  reason?: string,
  unmatched?: string[]
}

interface Assignment {
  matching: [ string, string ][],
  reason?: string,
  unmatched?: string[]
}
