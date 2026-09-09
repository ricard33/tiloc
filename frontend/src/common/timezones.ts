import timezones from 'timezones-list';

export function getTimeZoneOptions(showTimezoneOffset: boolean) {
  const offsetTmz = [];
  for (const i in timezones) {
    const tz = timezones[i];
    const timeZoneOption = {
      label: tz.tzCode,  //showTimezoneOffset ? tz.name : tz.name.slice(12),
      id: tz.tzCode
    };
    offsetTmz.push(timeZoneOption);
  }
  return offsetTmz;
}
