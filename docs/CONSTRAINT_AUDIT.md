# V1 Constraint Validation Audit

Live audit date: 19 September 2026. The initial global inventory contained 58 constraints with `convalidated = false`: 57 application-owned constraints in `public` and one Supabase-managed constraint in `realtime`. Every application constraint below was validated against historical rows and then marked valid. No violating historical application rows were found.

## Release-gate result

**Application release gate: PASS.** All 57 application-owned constraints were validated, zero application-owned constraints remain `NOT VALID`, and zero historical application-data violations were found.

**Supabase-managed infrastructure: informational.** `realtime.messages.messages_payload_exclusive` remains `NOT VALID`. It belongs to Supabase-managed infrastructure, is owned by `supabase_realtime_admin`, and is outside the application's ownership and release scope. Its table contained zero rows and therefore zero violations when audited. Do not alter the table, change its ownership, assume its owner role, or validate/recreate the constraint from application migrations.

| Schema/table | Constraint | Type | Definition | Result |
|---|---|---|---|---|
| public.admissions | admissions_batch_course_branch_fkey | FK | `(batch_id, course_id, branch_id) -> batches(id, course_id, branch_id)` | Safe; validated |
| public.admissions | admissions_batch_required | CHECK | `batch_id IS NOT NULL` | Safe; validated |
| public.admissions | admissions_branch_required | CHECK | `branch_id IS NOT NULL` | Safe; validated |
| public.admissions | admissions_course_branch_fkey | FK | `(course_id, branch_id) -> courses(id, branch_id)` | Safe; validated |
| public.admissions | admissions_course_required | CHECK | `course_id IS NOT NULL` | Safe; validated |
| public.admissions | admissions_email_required | CHECK | `length(trim(email)) > 0` | Safe; validated |
| public.admissions | admissions_enrollment_date_valid | CHECK | Approved requires enrollment date; other states forbid it | Safe; validated |
| public.admissions | admissions_name_required | CHECK | `length(trim(student_name)) > 0` | Safe; validated |
| public.admissions | admissions_status_valid | CHECK | Status in pending/approved/rejected | Safe; validated |
| public.batches | batches_branch_required | CHECK | `branch_id IS NOT NULL` | Safe; validated |
| public.batches | batches_capacity_valid | CHECK | Positive capacity and enrollment between zero and capacity | Safe; validated |
| public.batches | batches_course_branch_fkey | FK | `(course_id, branch_id) -> courses(id, branch_id)` | Safe; validated |
| public.batches | batches_date_range_valid | CHECK | End date is not before start date | Safe; validated |
| public.batches | batches_name_required | CHECK | `length(trim(name)) > 0` | Safe; validated |
| public.batches | batches_teacher_branch_fkey | FK | `(teacher_id, branch_id) -> profiles(id, branch_id)` | Safe; validated |
| public.branches | branches_country_india | CHECK | `country = 'India'` | Safe; validated |
| public.branches | branches_pin_code_valid | CHECK | PIN is null or six digits beginning 1–9 | Safe; validated |
| public.courses | courses_branch_required | CHECK | `branch_id IS NOT NULL` | Safe; validated |
| public.courses | courses_duration_nonnegative | CHECK | Duration is null or nonnegative | Safe; validated |
| public.courses | courses_instructor_branch_fkey | FK | `(instructor_id, branch_id) -> profiles(id, branch_id)` | Safe; validated |
| public.courses | courses_level_valid | CHECK | Level in Beginner/Intermediate/Advanced | Safe; validated |
| public.courses | courses_name_required | CHECK | `length(trim(name)) > 0` | Safe; validated |
| public.courses | courses_price_nonnegative | CHECK | Price is null or nonnegative | Safe; validated |
| public.fees | fees_amounts_valid | CHECK | Total/paid nonnegative and paid does not exceed total | Safe; validated |
| public.fees | fees_batch_course_branch_fkey | FK | `(batch_id, course_id, branch_id) -> batches(id, course_id, branch_id)` | Safe; validated |
| public.fees | fees_course_branch_fkey | FK | `(course_id, branch_id) -> courses(id, branch_id)` | Safe; validated |
| public.fees | fees_status_valid_v1 | CHECK | Status in pending/partial/paid/overdue | Safe; validated |
| public.homework | homework_batch_course_branch_fkey | FK | `(batch_id, course_id, branch_id) -> batches(id, course_id, branch_id)` | Safe; validated |
| public.homework | homework_batch_required | CHECK | `batch_id IS NOT NULL` | Safe; validated |
| public.homework | homework_branch_required | CHECK | `branch_id IS NOT NULL` | Safe; validated |
| public.homework | homework_course_branch_fkey | FK | `(course_id, branch_id) -> courses(id, branch_id)` | Safe; validated |
| public.homework | homework_course_required | CHECK | `course_id IS NOT NULL` | Safe; validated |
| public.homework | homework_dates_valid | CHECK | Due date is not before assigned date | Safe; validated |
| public.homework | homework_teacher_assignment_fkey | FK | `(teacher_id, course_id, branch_id) -> teacher_course_assignments(...)` | Safe; validated |
| public.homework | homework_teacher_branch_fkey | FK | `(teacher_id, branch_id) -> profiles(id, branch_id)` | Safe; validated |
| public.homework | homework_teacher_required | CHECK | `teacher_id IS NOT NULL` | Safe; validated |
| public.homework_submissions | homework_submission_marks_valid | CHECK | Marks null or nonnegative | Safe; validated |
| public.homework_submissions | homework_submission_status_valid | CHECK | Status in submitted/late/reviewed | Safe; validated |
| public.homework_submissions | homework_submissions_homework_restrict_fkey | FK | `homework_id -> homework(id) ON DELETE RESTRICT` | Safe; validated |
| public.profiles | profiles_branch_id_fkey | FK | `branch_id -> branches(id)` | Safe; validated |
| public.profiles | profiles_role_check | CHECK | Role in admin/branch_manager/teacher/student | Safe; validated |
| public.profiles | profiles_status_valid | CHECK | Status in active/inactive | Safe; validated |
| public.stock | stock_branch_required | CHECK | `branch_id IS NOT NULL` | Safe; validated |
| public.stock | stock_values_valid | CHECK | Quantity/minimum stock and optional unit price nonnegative | Safe; validated |
| public.test_results | test_results_batch_course_branch_fkey | FK | `(batch_id, course_id, branch_id) -> batches(id, course_id, branch_id)` | Safe; validated |
| public.test_results | test_results_course_branch_fkey | FK | `(course_id, branch_id) -> courses(id, branch_id)` | Safe; validated |
| public.test_results | test_results_marks_valid | CHECK | Positive total and obtained marks between zero and total | Safe; validated |
| public.test_results | test_results_percentage_derived | CHECK | Percentage null or derived from obtained/total marks | Safe; validated |
| public.timetable | timetable_batch_course_branch_fkey | FK | `(batch_id, course_id, branch_id) -> batches(id, course_id, branch_id)` | Safe; validated |
| public.timetable | timetable_batch_required | CHECK | `batch_id IS NOT NULL` | Safe; validated |
| public.timetable | timetable_branch_required | CHECK | `branch_id IS NOT NULL` | Safe; validated |
| public.timetable | timetable_course_branch_fkey | FK | `(course_id, branch_id) -> courses(id, branch_id)` | Safe; validated |
| public.timetable | timetable_course_required | CHECK | `course_id IS NOT NULL` | Safe; validated |
| public.timetable | timetable_day_valid | CHECK | Day is Monday through Sunday | Safe; validated |
| public.timetable | timetable_teacher_branch_fkey | FK | `(teacher_id, branch_id) -> profiles(id, branch_id)` | Safe; validated |
| public.timetable | timetable_teacher_course_assignment_fkey | FK | `(teacher_id, course_id, branch_id) -> teacher_course_assignments(...)` | Safe; validated |
| public.timetable | timetable_teacher_required | CHECK | `teacher_id IS NOT NULL` | Safe; validated |
| public.timetable | timetable_time_valid | CHECK | `end_time > start_time` | Safe; validated |
| realtime.messages | messages_payload_exclusive | CHECK | `payload IS NULL OR binary_payload IS NULL` | Informational: zero rows/violations; Supabase-managed |

Final application state: zero unvalidated constraints in the application-owned `public` schema. Application migration 022 deliberately excludes managed schemas.

Future release audits must scope constraint validation to application-owned schemas and tables. A global PostgreSQL catalog query can include constraints owned by Supabase services and must not be used by itself as an application release gate.
