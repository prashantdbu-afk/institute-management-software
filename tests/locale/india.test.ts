import { describe,expect,it } from "vitest"
import { formatINR,formatIndianAddress,formatIndianDate,formatIndianDateTime,formatIndianTime,getIndiaToday,validateIndianPinCode } from "../../lib/locale/india"

describe("India localization",()=>{
  it("formats INR with Indian grouping",()=>expect(formatINR(125000)).toBe("₹1,25,000"))
  it("formats dates as DD/MM/YYYY",()=>expect(formatIndianDate("2026-09-18")).toBe("18/09/2026"))
  it("uses Asia/Kolkata for absolute timestamps",()=>expect(formatIndianTime("2026-09-18T00:00:00Z")).toBe("05:30 AM"))
  it("formats timetable times with AM/PM",()=>{expect(formatIndianTime("09:30")).toBe("09:30 AM");expect(formatIndianTime("13:15")).toBe("01:15 PM")})
  it("formats date and time together",()=>expect(formatIndianDateTime("2026-09-18T04:00:00Z")).toBe("18/09/2026, 09:30 AM"))
  it("derives today's form date in Asia/Kolkata",()=>expect(getIndiaToday(new Date("2026-09-18T20:00:00Z"))).toBe("2026-09-19"))
  it("validates six digit Indian PIN codes",()=>{expect(validateIndianPinCode("560038")).toBe(true);expect(validateIndianPinCode("012345")).toBe(false);expect(validateIndianPinCode("56038")).toBe(false)})
  it("handles empty values safely",()=>{expect(formatINR(null)).toBe("—");expect(formatIndianDate("")).toBe("—");expect(formatIndianTime(null)).toBe("—");expect(formatIndianAddress(null)).toBe("—")})
})
