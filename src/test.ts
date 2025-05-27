/*******************************************************************************
 * Copyright 2014 CapitalOne, LLC.
 * Further development Copyright 2022 Sapient Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/

// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

declare const require: any;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

const moduleArray = ['dashboard', 'config', 'authentication'];

const allSpecFiles = Object.keys((window as any).__karma__.files)
  .filter((file) => file.endsWith('.spec.ts'))
  .filter((file) => moduleArray.some((module) => file.includes(`/${module}/`)));

const importAllSpecFiles = async (): Promise<void> => {
  try {
    for (const file of allSpecFiles) {
      await import(file);
    }
    console.log('All spec files have been successfully imported.');
  } catch (error) {
    console.error('Error importing spec files:', error);
  }
};

(async () => {
  await importAllSpecFiles();
})();
