import timezones from 'timezones-list';

export function getTimeZoneOptions(showTimezoneOffset: boolean) {
  let offsetTmz = [];
  for (let i in timezones) {
    var tz = timezones[i];
    var timeZoneOption = {
      label: tz.tzCode,  //showTimezoneOffset ? tz.name : tz.name.slice(12),
      id: tz.tzCode
    };
    offsetTmz.push(timeZoneOption);
  }
  return offsetTmz;
}
