import dayjs from 'dayjs';

export default class DateHelper {
  static currentTimestamp() {
    return Math.floor(+new Date() / 1000);
  }
  static currentTimestamp1000() {
    return Math.floor(+new Date());
  }
  static formatGroupUpdatedTime(
    ts: number,
    dateFormat: string = 'hh:mm',
    locale: string = 'en'
  ) {
    return dayjs(new Date(ts * 1000))
      .locale(locale)
      .format(dateFormat);
  }
  static formatTime(ts: number, dateFormat: string = 'MM-DD hh:mm') {
    return dayjs(new Date(ts * 1000)).format(dateFormat);
  }
}
