export const deepDiffMapper = function() {
  return {
    VALUE_CREATED: 'created',
    VALUE_UPDATED: 'updated',
    VALUE_DELETED: 'deleted',
    VALUE_UNCHANGED: 'unchanged',
    map: function(obj1: Record<string, any> | undefined, obj2: Record<string, any>) {
      if (this.isFunction(obj1) || this.isFunction(obj2)) {
        throw Error('Invalid argument. Function given, object expected.');
      }
      if (this.isValue(obj1) || this.isValue(obj2)) {
        return {
          type: this.compareValues(obj1, obj2),
          data: obj1 === undefined ? obj2 : obj1
        };
      }

      let diff: Record<string, any> = {};
      for (let key in obj1) {
        if (this.isFunction(obj1[key])) {
          continue;
        }

        var value2 = undefined;
        if (obj2[key] !== undefined) {
          value2 = obj2[key];
        }

        diff[key] = this.map(obj1[key], value2);
      }
      for (var key in obj2) {
        if (this.isFunction(obj2[key]) || diff[key] !== undefined) {
          continue;
        }

        diff[key] = this.map(undefined, obj2[key]);
      }

      // for (var key in diff) {
      //   if (diff[key].type !== this.VALUE_UNCHANGED) {
      //     console.log('key = ', key);
      //     return {
      //       type: this.VALUE_UPDATED,
      //       data: diff
      //     };
      //   }
      // }
      // return {
      //   type: this.VALUE_UNCHANGED,
      //   data: diff
      // };
      return diff;

    },
    compareValues: function (value1: any, value2: any) {
      if (value1 === value2) {
        return this.VALUE_UNCHANGED;
      }
      if (this.isDate(value1) && this.isDate(value2) && value1.getTime() === value2.getTime()) {
        return this.VALUE_UNCHANGED;
      }
      if (value1 === undefined) {
        return this.VALUE_CREATED;
      }
      if (value2 === undefined) {
        return this.VALUE_DELETED;
      }
      return this.VALUE_UPDATED;
    },
    isFunction: function (x: any) {
      return Object.prototype.toString.call(x) === '[object Function]';
    },
    isArray: function (x: any) {
      return Object.prototype.toString.call(x) === '[object Array]';
    },
    isDate: function (x: any) {
      return Object.prototype.toString.call(x) === '[object Date]';
    },
    isObject: function (x: any) {
      return Object.prototype.toString.call(x) === '[object Object]';
    },
    isValue: function (x: any) {
      return !this.isObject(x) && !this.isArray(x);
    }
  }
}();

export function filterObject(obj: object, callback: (val: any, key: string) => boolean) {
  return Object.fromEntries(Object.entries(obj).filter(([key, val]) => callback(val, key)));
}

export const deepDiff = (obj1: any, obj2: any) => filterObject(deepDiffMapper.map(obj1, obj2), (f) => f.type !== "unchanged");
