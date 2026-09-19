import { expect, test, type Page } from "@playwright/test"
import { readE2EState } from "./support"

async function login(page: Page, role: "admin" | "student" | "teacher") {
  const state = await readE2EState()
  await page.goto("/")
  await page.getByLabel("Email Address").fill(state.users[role].email)
  await page.getByLabel("Password").fill(state.password)
  await page.getByRole("button", { name: "Sign In" }).click()
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/)
}

test("unauthenticated protected route redirects to login", async ({ page }) => {
  await page.goto("/dashboard/fees")
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible()
})

test.describe("admin V1 smoke", () => {
  test.beforeEach(async ({ page }) => login(page, "admin"))

  const routes = [
    ["Dashboard", "/dashboard"], ["Branches", "/dashboard/branches"], ["Courses", "/dashboard/courses"],
    ["Admissions", "/dashboard/admissions"], ["Students", "/dashboard/students"], ["Teachers", "/dashboard/teachers"],
    ["Timetable", "/dashboard/timetable"], ["Homework", "/dashboard/homework"], ["Test Results", "/dashboard/test-results"],
    ["Fees", "/dashboard/fees"], ["Stock", "/dashboard/stock"],
  ] as const

  for (const [name, route] of routes) {
    test(`${name} page loads`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(new RegExp(`${route.replaceAll("/", "\\/")}$`))
      await expect(page.getByRole("heading", { name, exact: false }).first()).toBeVisible()
    })
  }

  test("branch create persists across reload and is deleted safely", async ({ page }) => {
    const name = `V1 E2E Branch ${Date.now()}`
    await page.goto("/dashboard/branches")
    await page.getByRole("button", { name: "Add Branch" }).first().click()
    await page.getByLabel("Branch Name").fill(name)
    await page.getByLabel("Address Line 1").fill("12 Release Gate Road")
    await page.getByLabel("City").fill("Bengaluru")
    await page.getByLabel("State").fill("Karnataka")
    await page.getByLabel("PIN Code").fill("560001")
    await page.getByLabel("Email").fill(`v1.e2e.branch.${Date.now()}@example.com`)
    await page.getByRole("button", { name: "Add Branch" }).last().click()
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible()
    page.once("dialog", (dialog) => dialog.accept())
    await page.getByRole("button", { name: `Delete ${name}` }).click()
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(0)
  })
})

for (const role of ["student", "teacher"] as const) {
  test.describe(`${role} authorization routing`, () => {
    test.beforeEach(async ({ page }) => login(page, role))
    for (const route of ["/dashboard/users", "/dashboard/teachers", "/dashboard/branches"]) {
      test(`denies ${route}`, async ({ page }) => {
        await page.goto(route)
        await expect(page).toHaveURL(/\/dashboard\?denied=1$/)
      })
    }
    test("permits role dashboard", async ({ page }) => {
      await page.goto("/dashboard")
      await expect(page).toHaveURL(/\/dashboard$/)
    })
  })
}
