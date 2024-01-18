import {
  use
} from './use';
import ErrorPlugin from '@we-debug/plugin-error';
import RouterPlugin from '@we-debug/plugin-router';
import LauncherPlugin from '@we-debug/plugin-launcher';
import networkPlugin from '@we-debug/plugin-network';
import uiCheckPlugin from '@we-debug/plugin-ui-check/plugin';
import merge from 'deepmerge';
import {
  IWedebugInitOption
} from '../types';

/**
 * 初始化方法
 * @param {*} options
 */
export function init(this: any, options: IWedebugInitOption = {}) {
  options = merge(
    {
      launcher: true,
      plugin: {
        network: true,
        error: true,
        router: true,
        uiCheck: true
      }
    },
    options
  );

  if (options.launcher) use.call(this, LauncherPlugin, options.launcher || {});
  if (options?.plugin?.network) use.call(this, networkPlugin, options.plugin.network || {});
  if (options?.plugin?.error) use.call(this, ErrorPlugin, options.plugin.error || {});
  if (options?.plugin?.router) use.call(this, RouterPlugin, options.plugin.router || {});
  if (options?.plugin?.uiCheck) use.call(this, uiCheckPlugin, options.plugin.uiCheck || {});

  return this;
}
