import type { WeekdayName } from "../config/dealerCodes.js";

const WEEKDAYS: readonly WeekdayName[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

export interface ZonedDay {
  date: string;
  weekday: WeekdayName;
}

export function getZonedDay(
  date: Date = new Date(),
  timeZone: string = process.env.APP_TIME_ZONE ?? "America/New_York"
): ZonedDay {
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = Object.fromEntries(
    dateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const weekdayText = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long"
  })
    .format(date)
    .toLocaleLowerCase("en-US") as WeekdayName;

  if (!WEEKDAYS.includes(weekdayText)) {
    throw new Error(`Unsupported weekday: ${weekdayText}`);
  }

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: weekdayText
  };
}
