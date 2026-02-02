# PSIRA Frontend - Audit Report

**Fecha del audit:** 2026-02-02 03:23:34Z

Este reporte fue generado mediante análisis estático del repositorio y ejecución de herramientas locales (npm audit, búsquedas por ripgrep, build con stats.json).

## Parte 1: Hallazgos Críticos

### [P1] Vulnerabilidades npm (alto volumen, incluye CRITICAL)
- **Área:** Seguridad
- **Evidencia:** npm audit metadata: 108 HIGH y 18 CRITICAL (total metadata: 247). npm CLI reportó 223 vulnerabilities (18 critical).
- **Recomendación:** Plan por fases: (1) fixes sin breaking changes (npm audit fix), (2) upgrades mayores (Angular/RxJS/TS), (3) reemplazo de dependencias abandonadas. Ver detalle en 3.1/3.2.

### [P1] Token de autenticación almacenado en localStorage (riesgo XSS)
- **Área:** Seguridad
- **Evidencia:** Se usa localStorage para 'auth_app_token' (p.ej. AuthService.isLoggedIn() y ApiPrefixInterceptor).
- **Recomendación:** Migrar a cookies HttpOnly+Secure+SameSite (ideal) o evitar localStorage para access tokens (usar memory-only + refresh). Implementar expiración/refresh y limpieza al logout.

### [P1] Refresh de permisos se ejecuta en cada isLoggedIn() (side-effects en guard)
- **Área:** Arquitectura/Seguridad
- **Evidencia:** AuthService.isLoggedIn() invoca rePopulatePermissions() que hace subscribe() y escribe sessionStorage.
- **Recomendación:** Mover refresh a un flujo explícito (login/bootstrap) con caching/shareReplay y cancelación; evitar side-effects en guards.

### [P1] Bundle principal grande (main-es2015)
- **Área:** Rendimiento
- **Evidencia:** dist/stats.json: main-es2015.7a020155334bd14c6281.js = 14.55 MiB (sin compresión).
- **Recomendación:** Reducir vendor/app en main: revisar imports, tree-shaking, sustituir librerías pesadas (moment->date-fns/dayjs), dividir features y revisar SW prefetch (ver 3.4).

### [P2] Service Worker prefetch de todos los *.js/*.css (puede anular lazy loading)
- **Área:** Rendimiento/PWA
- **Evidencia:** ngsw-config.json assetGroup "app" con installMode=prefetch incluye /*.js y /*.css.
- **Recomendación:** Cambiar estrategia: cachear runtime+main+styles y dejar chunks lazy con installMode="lazy" o separar assetGroups. Evitar descargar todos los chunks al inicio.

## Parte 2: Matriz de Priorización

| Área | Severidad | Esfuerzo | Impacto | Prioridad |
|------|-----------|----------|---------|-----------|
| Security: npm vulnerabilities + dependency hygiene | HIGH | 40-80 hrs | 9/10 | P1 |
| Auth hardening (token storage, expiration, permission refresh) | HIGH | 24-40 hrs | 9/10 | P1 |
| Angular 10 → 14 → 18 (modernización) | HIGH | 160-240 hrs | 10/10 | P1 |
| TypeScript strictness + contención/eliminación de any | MED | 80-140 hrs | 7/10 | P2 |
| Performance: bundle reduction + SW caching strategy | MED | 40-80 hrs | 8/10 | P2 |
| Testing uplift (unit + E2E migration) | MED | 80-160 hrs | 8/10 | P2 |

## Parte 3: Análisis Detallado por Área

### 3.1 Seguridad

#### 3.1.1 npm audit

- **Resumen (metadata):** {"info":0,"low":14,"moderate":107,"high":108,"critical":18,"total":247}
- **Nota:** npm CLI mostró: 223 vulnerabilities (14 low, 102 moderate, 89 high, 18 critical).

**Top HIGH/CRITICAL (únicos por paquete, primer slice):**

| Paquete | Severidad | Direct/Transitive | Range vulnerable | Fix available | Advisory title | URL |
|---|---|---|---|---|---|---|
| @babel/traverse | critical | transitive | <7.23.2 | yes | Babel vulnerable to arbitrary code execution when compiling specifically crafted malicious code | https://github.com/advisories/GHSA-67hx-6x53-jw92 |
| @ngneat/until-destroy | critical | direct | 7.3.1 - 8.0.4 | yes |  |  |
| cipher-base | critical | transitive | <=1.0.4 | yes | cipher-base is missing type checks, leading to hash rewind and passing on crafted data | https://github.com/advisories/GHSA-cpq7-6gpm-g9rc |
| commitizen | critical | direct | >=1.0.5 | yes |  |  |
| crypto-js | critical | direct | <4.2.0 | yes | crypto-js PBKDF2 1,000 times weaker than specified in 1993 and 1.3M times weaker than current standard | https://github.com/advisories/GHSA-xwcq-pm8m-c4vf |
| elliptic | critical | transitive | * | yes | Elliptic Uses a Broken or Risky Cryptographic Algorithm | https://github.com/advisories/GHSA-r9p9-mrjm-926w |
| eventsource | critical | transitive | <1.1.1 | yes | Exposure of Sensitive Information in eventsource | https://github.com/advisories/GHSA-6h5x-7c5m-7cr7 |
| form-data | critical | transitive | <2.5.4 | htmlhint@1.8.0 | form-data uses unsafe random function in form-data for choosing boundary | https://github.com/advisories/GHSA-fjxv-7rqg-78g4 |
| hads | critical | direct | * | hads@3.0.3 |  |  |
| json-schema | critical | transitive | <0.4.0 | yes | json-schema is vulnerable to Prototype Pollution | https://github.com/advisories/GHSA-896r-f27r-55mw |
| jsprim | critical | transitive | 0.3.0 - 1.4.1 \|\| 2.0.0 - 2.0.1 | yes |  |  |
| loader-utils | critical | transitive | <=1.4.1 \|\| 2.0.0 - 2.0.3 | @angular-devkit/build-angular@21.1.2 | Prototype pollution in webpack loader-utils | https://github.com/advisories/GHSA-76p3-8jx3-jpfq |
| minimist | critical | transitive | <=0.2.3 \|\| 1.0.0 - 1.2.5 | hads@3.0.3 | Prototype Pollution in minimist | https://github.com/advisories/GHSA-vh95-rmgr-6w4m |
| optimist | critical | transitive | >=0.6.0 | hads@3.0.3 |  |  |
| pbkdf2 | critical | transitive | <=3.1.2 | yes | pbkdf2 silently disregards Uint8Array input, returning static keys | https://github.com/advisories/GHSA-v62p-rq8g-8h59 |
| request | critical | transitive | * | htmlhint@1.8.0 | Server-Side Request Forgery in Request | https://github.com/advisories/GHSA-p8p7-x288-28g6 |
| sha.js | critical | transitive | <=2.4.11 | yes | sha.js is missing type checks leading to hash rewind and passing on crafted data | https://github.com/advisories/GHSA-95m3-7q98-8xr5 |
| url-parse | critical | transitive | <=1.5.8 | yes | Authorization bypass in url-parse | https://github.com/advisories/GHSA-rqff-837h-mm52 |
| @angular-devkit/build-angular | high | direct | <=19.2.14 \|\| 20.0.0-next.0 - 20.0.0-rc.4 | @angular-devkit/build-angular@21.1.2 |  |  |
| @angular-devkit/build-optimizer | high | transitive | 0.901.0-next.0 - 0.1200.0-rc.3 | @angular-devkit/build-angular@21.1.2 |  |  |
| @angular/animations | high | direct | <=18.2.14 | @angular/animations@21.1.2 |  |  |
| @angular/cdk | high | transitive | <=6.4.7 \|\| 8.0.0-beta.0 - 17.3.10 | ng-zorro-antd@21.0.2 |  |  |
| @angular/cli | high | direct | <=1.4.0-rc.2 \|\| 6.2.9 - 20.3.14 \|\| 21.0.0-next.0 - 21.0.0-rc.6 | @angular/cli@21.1.2 |  |  |
| @angular/common | high | direct | <=19.2.15 | ng-zorro-antd@21.0.2 | Angular is Vulnerable to XSRF Token Leakage via Protocol-Relative URLs in Angular HTTP Client | https://github.com/advisories/GHSA-58c5-g7wp-6w37 |
| @angular/compiler | high | direct | <=18.2.14 | @angular/compiler@21.1.2 | Angular Stored XSS Vulnerability via SVG Animation, SVG URL and MathML Attributes | https://github.com/advisories/GHSA-v4hv-rgfq-gp49 |
| @angular/compiler-cli | high | direct | <=18.2.14 | @angular/compiler-cli@21.1.2 |  |  |
| @angular/core | high | direct | <=18.2.14 | ng-zorro-antd@21.0.2 | Angular vulnerable to Cross-site Scripting | https://github.com/advisories/GHSA-c75v-2vq8-878f |
| @angular/forms | high | direct | <=19.2.15 | @angular/forms@21.1.2 |  |  |
| @angular/localize | high | direct | 10.0.0-next.0 - 18.2.14 | @angular/localize@21.1.2 |  |  |
| @angular/platform-browser | high | direct | <=19.2.15 | @angular/platform-browser@21.1.2 |  |  |
| @angular/platform-browser-dynamic | high | direct | <=19.2.15 | @angular/platform-browser-dynamic@21.1.2 |  |  |
| @angular/router | high | direct | <=0.0.0-ROUTERPLACEHOLDER \|\| 2.0.0-rc.0 - 19.2.15 | @angular/router@21.1.2 |  |  |
| @angular/service-worker | high | direct | <=19.1.3 \|\| 19.2.0-next.0 - 19.2.0-rc.0 | @angular/service-worker@21.1.2 |  |  |
| @ant-design/icons-angular | high | transitive | <=18.0.0 | ng-zorro-antd@21.0.2 |  |  |
| @biesbjerg/ngx-translate-extract | high | direct | 3.0.0 - 7.0.2 | @biesbjerg/ngx-translate-extract@7.0.4 |  |  |
| @kolkov/angular-editor | high | direct | <=0.11.3 \|\| 0.14.4 - 2.0.0 | @kolkov/angular-editor@3.0.5 |  |  |
| @ng-bootstrap/ng-bootstrap | high | direct | <=17.0.1 | @ng-bootstrap/ng-bootstrap@20.0.0 |  |  |
| @ngtools/webpack | high | transitive | <=1.2.13 \|\| 6.0.0-beta.2 - 18.2.21 | @angular-devkit/build-angular@21.1.2 |  |  |
| @schematics/update | high | transitive | >=0.11.0-beta.0 | @angular/cli@21.1.2 |  |  |
| adjust-sourcemap-loader | high | transitive | 0.1.0 - 2.0.0 | @angular-devkit/build-angular@21.1.2 |  |  |

> Referencia: output completo generado durante el audit en `/tmp/npm-audit.txt` y `/tmp/npm-audit.json` (no versionado).

#### 3.1.2 Uso de `any` en TypeScript

- **Total coincidencias (\bany\b en TS):** 558
- **Archivos afectados (top 20 por cantidad):**

| Archivo | # de ocurrencias |
|---|---:|
| src/app/@shared/components/table/table.component.ts | 32 |
| src/app/pages/patients-management/create-assessment/create-assessment.component.ts | 22 |
| src/app/@shared/components/form/form.component.ts | 21 |
| src/app/pages/assessment/plan-assessment/plan-assessment.component.ts | 20 |
| src/app/assessment-form/questionnaire-form/questionnaire-form.component.ts | 17 |
| src/app/pages/assessment/@services/assessment.service.ts | 13 |
| src/app/pages/user-management/user-form/user-form.component.ts | 12 |
| src/app/pages/patients-management/informants-list/informants-list.component.ts | 12 |
| src/app/pages/administration/@services/roles.service.ts | 11 |
| src/app/pages/user-management/@services/users.service.ts | 8 |
| src/app/pages/questionnaire-management/questionnaire-script/questionnaire-script.component.ts | 8 |
| src/app/@shared/classes/convert.ts | 8 |
| src/app/pages/patients-management/@services/caregivers.service.ts | 8 |
| src/app/pages/administration/roles-and-permissions/roles-and-permissions.component.ts | 8 |
| src/app/assessment-form/assessment-form.component.ts | 8 |
| src/app/pages/administration/email-templates/email-templates.component.ts | 8 |
| src/app/pages/administration/create-email-template/create-email-template.component.ts | 8 |
| src/app/pages/questionnaire-management/questionnaire-bundles-list/questionnaire-bundles-list.component.ts | 7 |
| src/app/pages/questionnaire-management/create-questionnaire-bundle/create-questionnaire-bundle.component.ts | 7 |
| src/app/pages/patients-management/@services/patients.service.ts | 7 |

**Muestras (primeras 120 ocurrencias) con archivo/línea:**

| Archivo | Línea | Snippet |
|---|---:|---|
| src/test-config.helper.ts | 4 | providers: any[]; |
| src/setup-jest.ts | 31 | getPropertyValue: (prop: any) => { |
| src/setup-jest.ts | 38 | value: (query: any) => ({ |
| src/setup-jest.ts | 41 | onchange: null as any, |
| src/polyfills.ts | 27 | * Standard animation support in Angular DOES NOT require any polyfills (as of Angular 6.0). |
| src/polyfills.ts | 44 | * (window as any).__Zone_disable_requestAnimationFrame = true; // disable patch requestAnimationFrame |
| src/polyfills.ts | 45 | * (window as any).__Zone_disable_on_property = true; // disable patch onProperty such as onclick |
| src/polyfills.ts | 46 | * (window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove']; // disable patch specified eventNames |
| src/polyfills.ts | 51 | *  (window as any).__Zone_enable_cross_context_check = true; |
| src/hmr.ts | 4 | export function hmrBootstrap(module: any, bootstrap: () => Promise<NgModuleRef<any>>) { |
| src/hmr.ts | 5 | let ngModule: NgModuleRef<any>; |
| src/app/questionnaire/questionnaires-list/questionnaires-list.component.ts | 15 | questionnaires: any[] = [ |
| src/app/questionnaire/question/question.component.ts | 11 | @Output() getNextQuestion: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/questionnaire/question/question.component.ts | 12 | @Output() getPreviousQuestion: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/questionnaire/do-assessment/do-assessment.component.ts | 14 | questionnaire: any; |
| src/app/@shared/services/xls-export.service.ts | 14 | public exportExcel(jsonData: any[], fileName: string): void { |
| src/app/@shared/services/xls-export.service.ts | 17 | const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); |
| src/app/@shared/services/xls-export.service.ts | 21 | private saveExcelFile(buffer: any, fileName: string): void { |
| src/app/pages/user-management/users-list/users-list.component.ts | 121 | this.data = data.users.edges.map((user: any) => UserModel.fromJson(user.node)); |
| src/app/pages/user-management/users-list/users-list.component.ts | 163 | const departments: Department[] = data.departments.edges.map((e: any) => e.node); |
| src/app/pages/user-management/users-list/users-list.component.ts | 172 | const roles: Role[] = data.roles.edges.map((e: any) => e.node); |
| src/app/@shared/services/theme-constant.service.ts | 10 | private colorConfig: any = { |
| src/app/pages/user-management/user-form/user-form.component.ts | 54 | tabSub: any; |
| src/app/pages/user-management/user-form/user-form.component.ts | 55 | routeSub: any; |
| src/app/pages/user-management/user-form/user-form.component.ts | 56 | tabIndexSub: any; |
| src/app/pages/user-management/user-form/user-form.component.ts | 97 | ({ data }: any) => { |
| src/app/pages/user-management/user-form/user-form.component.ts | 99 | page.edges.map((departmentData: any) => { |
| src/app/pages/user-management/user-form/user-form.component.ts | 107 | field.options = page.edges.map((departmentData: any) => { |
| src/app/pages/user-management/user-form/user-form.component.ts | 141 | const options: any = []; |
| src/app/pages/user-management/user-form/user-form.component.ts | 144 | ({ data }: any) => { |
| src/app/pages/user-management/user-form/user-form.component.ts | 145 | data.roles.edges.map((role: any) => { |
| src/app/pages/user-management/user-form/user-form.component.ts | 240 | createUser(formData: any) { |
| src/app/pages/user-management/user-form/user-form.component.ts | 430 | submitForm(form: any): void { |
| src/app/pages/user-management/user-form/user-form.component.ts | 452 | updateUserPassword(form: any) { |
| src/app/@shared/pipes/search.pipe.ts | 7 | public transform(value: any, keys: string, term: string) { |
| src/app/@shared/pipes/search.pipe.ts | 9 | return (value \|\| []).filter((item: any) => |
| src/app/@shared/pipes/iconFilter.pipe.ts | 6 | transform(items: any[], searchText: string): any[] { |
| src/app/@shared/pipes/date.pipe.ts | 8 | transform(date: any, args?: any): any { |
| src/app/pages/user-management/@services/users.service.ts | 19 | getUsers(options?: { filter?: any; paging?: Paging; sorting?: Sorting[] }): Observable<FetchResult<any>> { |
| src/app/pages/user-management/@services/users.service.ts | 31 | createUser(createOneUserInput: CreateOneUserInput): Observable<FetchResult<any>> { |
| src/app/pages/user-management/@services/users.service.ts | 39 | updateUser(updateOneUserInput: UpdateOneUserInput): Observable<FetchResult<any>> { |
| src/app/pages/user-management/@services/users.service.ts | 47 | updateUserAcceptedTerm(updateOneUserInput: UpdateOneUserInput): Observable<FetchResult<any>> { |
| src/app/pages/user-management/@services/users.service.ts | 55 | changeUserPassword(inputs: UserChangePasswordInput): Observable<FetchResult<any>> { |
| src/app/pages/user-management/@services/users.service.ts | 63 | updateUserPassword(inputs: UserUpdatePasswordInput): Observable<FetchResult<any>> { |
| src/app/pages/user-management/@services/users.service.ts | 71 | deleteOneUser(input: DeleteOneInput): Observable<FetchResult<any>> { |
| src/app/pages/user-management/@services/users.service.ts | 79 | softDeleteUser(user: User): Observable<FetchResult<any>> { |
| src/app/@shared/components/user-picker/user-picker.component.ts | 68 | .pipe(map(({ data }) => (data?.users?.edges ?? []).map((user: any) => UserModel.fromJson(user.node)))) |
| src/app/@shared/components/table/table.component.ts | 31 | @Input() listOfColumn: any[] = []; |
| src/app/@shared/components/table/table.component.ts | 38 | @Input() listOfCustomActions: any[] = []; |
| src/app/@shared/components/table/table.component.ts | 39 | @Input() exportData: any[] = []; |
| src/app/@shared/components/table/table.component.ts | 40 | @Input() listOfData: any[] = []; |
| src/app/@shared/components/table/table.component.ts | 44 | @Output() onEdit: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 45 | @Output() onFilterButton: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 46 | @Output() onDelete: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 47 | @Output() onView: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 48 | @Output() onButton: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 49 | @Output() onSearch: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 50 | @Output() onImport: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 51 | @Output() onCustomAction: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 52 | @Output() onAction: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 53 | @Output() onNext: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 54 | @Output() onPrevious: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 55 | @Output() onParamChange: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 56 | @Output() onDateFilter: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 57 | @Output() rowClick: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/table/table.component.ts | 61 | dateRange: any[] = []; |
| src/app/@shared/components/table/table.component.ts | 63 | searchValue: any = ''; |
| src/app/@shared/components/table/table.component.ts | 64 | listOfDisplayData: any[] = []; |
| src/app/@shared/components/table/table.component.ts | 65 | listOfCurrentPageData: any[] = []; |
| src/app/@shared/components/table/table.component.ts | 86 | onCurrentPageDataChange(listOfCurrentPageData: any[]): void { |
| src/app/@shared/components/table/table.component.ts | 114 | onFilterSearch(column: any): void { |
| src/app/@shared/components/table/table.component.ts | 137 | onViewAction(data: any, index: number = -1) { |
| src/app/@shared/components/table/table.component.ts | 141 | onEditAction(data: any, index: number = -1) { |
| src/app/@shared/components/table/table.component.ts | 145 | onDeleteAction(data: any, index: number = -1) { |
| src/app/@shared/components/table/table.component.ts | 161 | onSearchAction(data: any) { |
| src/app/@shared/components/table/table.component.ts | 169 | onCustomActionEvent(event: any, data: any) { |
| src/app/@shared/components/table/table.component.ts | 174 | emitAction(action: any, index: number) { |
| src/app/@shared/components/table/table.component.ts | 178 | onDateFilterChange($event: any) { |
| src/app/@shared/components/table/table.component.ts | 190 | handleRowClick(row: any, index: number) { |
| src/app/pages/questionnaire-management/questionnaire-script/questionnaire-script.component.ts | 109 | public handleRowClick(event: any) { |
| src/app/pages/questionnaire-management/questionnaire-script/questionnaire-script.component.ts | 161 | const options: any = []; |
| src/app/pages/questionnaire-management/questionnaire-script/questionnaire-script.component.ts | 164 | ({ data }: any) => { |
| src/app/pages/questionnaire-management/questionnaire-script/questionnaire-script.component.ts | 165 | data.reports.edges.map((report: any) => { |
| src/app/pages/questionnaire-management/questionnaire-script/questionnaire-script.component.ts | 187 | const inputData: any = { ...inputValues }; |
| src/app/pages/questionnaire-management/questionnaire-script/questionnaire-script.component.ts | 189 | const scriptInput: any = { ...inputValues, scriptText, reportIds: reports }; |
| src/app/pages/questionnaire-management/questionnaire-script/questionnaire-script.component.ts | 275 | ({ data }: any) => { |
| src/app/pages/questionnaire-management/questionnaire-script/questionnaire-script.component.ts | 276 | this.data = data.scripts.edges.map((script: any) => ScriptsModel.fromJson(script.node)); |
| src/app/@shared/components/patient-picker/patient-picker.component.ts | 62 | .pipe(map(({ data }) => (data?.patients?.edges ?? []).map((patient: any) => PatientModel.fromJson(patient.node)))) |
| src/app/pages/questionnaire-management/questionnaire-profile/questionnaire-form/questionnaire-form.component.ts | 31 | listOfOption: any = []; |
| src/app/pages/questionnaire-management/questionnaire-profile/questionnaire-form/questionnaire-form.component.ts | 32 | listOfTagOptions: any = []; |
| src/app/pages/questionnaire-management/questionnaire-profile/questionnaire-form/questionnaire-form.component.ts | 56 | public onSubmit(form: { [K in keyof CreateQuestionnaireInput]: any }): void { |
| src/app/pages/questionnaire-management/questionnaire-bundles-list/questionnaire-bundles-list.component.ts | 25 | public data: Partial<any>[] \| any; |
| src/app/pages/questionnaire-management/questionnaire-bundles-list/questionnaire-bundles-list.component.ts | 26 | public columns: TableColumn<Partial<any>>[] = QuestionnaireBundlesColumns; |
| src/app/pages/questionnaire-management/questionnaire-bundles-list/questionnaire-bundles-list.component.ts | 29 | public actions: Action<ActionKey>[] \| any = []; |
| src/app/pages/questionnaire-management/questionnaire-bundles-list/questionnaire-bundles-list.component.ts | 59 | .subscribe((x: any) => { |
| src/app/pages/questionnaire-management/questionnaire-bundles-list/questionnaire-bundles-list.component.ts | 60 | this.data = x.data?.getQuestionnaireBundles?.edges.map((q: any) => q.node); |
| src/app/pages/questionnaire-management/questionnaire-bundles-list/questionnaire-bundles-list.component.ts | 79 | public onSort(sorting: SortField<any>[]): void { |
| src/app/pages/questionnaire-management/questionnaire-bundles-list/questionnaire-bundles-list.component.ts | 87 | public onAction({ action, context: assessmentAdministration }: ActionArgs<any, ActionKey>): void { |
| src/app/@shared/components/form/input-types/text-input/text-input.component.ts | 15 | @Output() valueChange: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/form/input-types/text-input/text-input.component.ts | 55 | handleValueChange(input: any) { |
| src/app/pages/questionnaire-management/create-questionnaire-bundle/create-questionnaire-bundle.component.ts | 32 | bundle: any; |
| src/app/pages/questionnaire-management/create-questionnaire-bundle/create-questionnaire-bundle.component.ts | 65 | .subscribe((data: any) => { |
| src/app/pages/questionnaire-management/create-questionnaire-bundle/create-questionnaire-bundle.component.ts | 69 | this.bundleForm.patchValue({ questionnaireIds: this.bundle?.questionnaires.map((q: any) => q._id) }); |
| src/app/pages/questionnaire-management/create-questionnaire-bundle/create-questionnaire-bundle.component.ts | 119 | ({ data }: any) => { |
| src/app/pages/questionnaire-management/create-questionnaire-bundle/create-questionnaire-bundle.component.ts | 120 | this.listOfDepartments = data.departments.edges.map((department: any) => |
| src/app/pages/questionnaire-management/create-questionnaire-bundle/create-questionnaire-bundle.component.ts | 128 | selectDepartments(event: any) { |
| src/app/pages/questionnaire-management/create-questionnaire-bundle/create-questionnaire-bundle.component.ts | 135 | (departmentId: any) => departmentId === currentDepartmentId |
| src/app/@shared/components/form/input-types/text-area-input/text-area-input.component.ts | 14 | @Input() inputModel: any; |
| src/app/@shared/components/form/input-types/text-area-input/text-area-input.component.ts | 15 | @Output() valueChange: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/form/input-types/text-area-input/text-area-input.component.ts | 55 | handleValueChange(input: any) { |
| src/app/pages/questionnaire-management/@types/questionnaire.ts | 47 | uniqueQuestions: any; |
| src/app/@shared/components/form/input-types/select-input/select-input.component.ts | 14 | @Input() inputModel: any; |
| src/app/@shared/components/form/input-types/select-input/select-input.component.ts | 15 | @Output() valueChange: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/form/input-types/select-input/select-input.component.ts | 55 | handleValueChange(input: any) { |
| src/app/pages/questionnaire-management/@services/scripts.service.ts | 28 | }): Observable<FetchResult<any>> { |
| src/app/pages/questionnaire-management/@services/scripts.service.ts | 41 | createScript(createOneScriptInput: CreateOneScriptInput): Observable<FetchResult<any>> { |
| src/app/pages/questionnaire-management/@services/scripts.service.ts | 53 | updateScript(id: number, updateOneScriptInput: CreateOneScriptInput): Observable<FetchResult<any>> { |
| src/app/pages/questionnaire-management/@services/scripts.service.ts | 67 | deleteScript(script: Scripts): Observable<FetchResult<any>> { |
| src/app/@shared/components/form/input-types/search-input/search-input.component.ts | 16 | @Output() valueChange: EventEmitter<any> = new EventEmitter<any>(); |
| src/app/@shared/components/form/input-types/search-input/search-input.component.ts | 17 | @Output() searchOptions: EventEmitter<any> = new EventEmitter<any>(); |

> Para la lista completa (558 entradas), usar el artefacto generado durante el audit: `/tmp/any-locations.json` (no versionado).

#### 3.1.3 Autenticación / Autorización

- **AuthGuard:** valida solo existencia de token en localStorage vía AuthService.isLoggedIn(); no valida expiración.
- **PermissionGuard:** evalúa permissionsOnly/Except desde route.data; si falla retorna false sin redirección/telemetría.
- **Storage:** lecturas de localStorage/sessionStorage para user/settings/permissions.

#### 3.1.4 Manejo de datos sensibles en memoria

- Se observan accesos a localStorage.getItem('auth_app_token') y localStorage.getItem('user').
- Riesgo: tokens y perfil quedan disponibles a scripts inyectados (XSS).

#### 3.1.5 HTTP requests y validación de datos

- El frontend usa principalmente Apollo GraphQL (apollo-angular).
- Interceptors HTTP: ApiPrefixInterceptor agrega Authorization y maneja 401/UNAUTHENTICATED; ErrorHandlerInterceptor loguea errores en dev.
- Falta: validación tipada (DTOs), sanitización y manejo robusto de errores GraphQL.

### 3.2 Dependencias

#### 3.2.1 Versiones principales (actuales)

| Dependencia | Versión actual (package.json) | Recomendado | Notas |
|---|---|---|---|
| @angular/animations | ^10.0.14 | 18.x+ | Actualizar por etapas; compatibilidad fuerte entre @angular/*, TS y RxJS. |
| @angular/common | ^10.0.14 | 18.x+ | Actualizar por etapas; compatibilidad fuerte entre @angular/*, TS y RxJS. |
| @angular/core | ^10.0.14 | 18.x+ | Actualizar por etapas; compatibilidad fuerte entre @angular/*, TS y RxJS. |
| @angular/forms | ^10.0.14 | 18.x+ | Actualizar por etapas; compatibilidad fuerte entre @angular/*, TS y RxJS. |
| @angular/router | ^10.0.14 | 18.x+ | Actualizar por etapas; compatibilidad fuerte entre @angular/*, TS y RxJS. |
| @angular/cli | ~10.0.8 | 18.x+ | Actualizar por etapas; compatibilidad fuerte entre @angular/*, TS y RxJS. |
| @angular-devkit/build-angular | ^0.1000.8 | - |  |
| typescript | ~3.9.7 | 5.x (con Angular 17/18) | Hoy está ~3.9.7; se requiere salto gradual. |
| rxjs | ^6.5.5 | 7.x | Hoy 6.5.5; revisar breaking changes. |
| zone.js | ^0.10.3 | - |  |
| ng-zorro-antd | ^11.4.1 | Versión compatible con Angular objetivo | Upgrade puede ser grande (breaking changes por major). |
| @ng-bootstrap/ng-bootstrap | ^6.0.2 | - |  |
| apollo-angular | ^1.9.1 | - |  |
| apollo-client | ^2.6.8 | @apollo/client (moderno) | apollo-client v2 + apollo-link están legacy. |
| graphql | ^15.1.0 | - |  |
| tailwindcss | ^1.8.8 | - |  |
| bootstrap | ^4.1.1 | - |  |
| jquery | ^3.5.1 | - |  |
| moment | ^2.28.0 | dayjs/date-fns | Reducir bundle. |
| protractor | ~7.0.0 | Cypress/Playwright | Protractor está deprecado. |

#### 3.2.2 Dependencias deprecated / fuera de soporte (indicativas)

- **TSLint/codelyzer**: stack legacy (reemplazar por ESLint).
- **Protractor**: deprecado; migrar E2E a Cypress/Playwright.
- **apollo-client v2 / apollo-link**: legacy vs @apollo/client.
- **Tailwind 1.x**: muy antiguo; upgrade implica breaking changes.

### 3.3 Arquitectura

#### 3.3.1 Estructura de módulos

- Convención presente: src/app/@core, src/app/@shared, src/app/@layout, src/app/pages, src/app/assessment-form.

**Diagrama conceptual (alto nivel):**

```text
AppModule
 ├─ CoreModule (@core): interceptors, logger, utilities
 ├─ SharedModule (@shared): components, pipes, services reutilizables
 ├─ Layout (@layout): shells (auth/backend/assessment)
 ├─ Feature modules (lazy): pages/* (dashboard, patients, questionnaire, admin, feedback...)
 └─ assessment-form (lazy)
```

#### 3.3.2 Lazy loading

- Se detecta uso de lazy loading via loadChildren en app-routing y pages-routing.
- Riesgo: SW prefetch puede descargar todos los chunks igual (ver 3.4).

#### 3.3.3 Gestión de estado

- No se observa un store centralizado tipo NgRx/Akita; hay uso de storage como cache de user/permissions/filtros.
- Recomendación: introducir state management (services + BehaviorSubject) o store (NgRx) para flujos críticos.

#### 3.3.4 Memory leaks potenciales

- Hay ~220 ocurrencias de subscribe() en src/app.
- Se usa untilDestroyed en algunos componentes (existe helper en @core).
- Acción: establecer estándar: streams largos siempre con untilDestroyed/takeUntil.

#### 3.3.5 TODO/FIXME encontrados

Total encontrados: 7

```text
src/app/pages/questionnaire-management/questionnaire-list/questionnaire-list.component.ts:33:// TODO: implement keyword search
src/app/pages/questionnaire-management/@forms/questionnaire.form.ts:56:          // TODO: get from correct language
src/app/pages/questionnaire-management/@forms/questionnaire.form.ts:154:          // TODO: get from correct language
src/app/pages/patients-management/patients-list/patients-list.component.ts:195:          this.pageInfo = patients.data.patients.pageInfo; // TODO: remove
src/app/pages/patients-management/departments/departments.component.ts:150:        this.pageInfo = response.data.departments.pageInfo; // TODO: remove
src/app/pages/patients-management/caregiver-list/caregiver-list.component.ts:154:        this.pageInfo = response.data.caregivers?.pageInfo; // TODO: remove
src/app/@shared/components/table/table.component.ts:43:  /* TODO: fix lint */
```

### 3.4 Rendimiento

#### 3.4.1 Change detection

- Componentes detectados (aprox): 96
- Componentes con OnPush (aprox): 1

#### 3.4.2 Bundle size (build con stats.json)

- **Total assets (sin compresión):** 24.57 MiB
- **main-es2015:** 14.55 MiB

Top 10 assets por tamaño:

| Asset | Size (MiB) |
|---|---:|
| main-es2015.7a020155334bd14c6281.js | 14.55 |
| styles-es2015.536d9806081f2c13ffe0.js | 1.98 |
| not-found.181c5a6430bcb77324b1.gif | 1.31 |
| fa-solid-900.13de59f1a36b6cb4bca0.svg | 0.88 |
| 9-es2015.1d5657d703acab921de5.js | 0.81 |
| fa-brands-400.216edb96b562c79adc09.svg | 0.71 |
| polyfills-es5.9276711a1235e7ec5080.js | 0.60 |
| 5-es2015.002740cfda67e8c360e9.js | 0.47 |
| 2-es2015.9df832a3ffc413812354.js | 0.40 |
| 4-es2015.e5b4f3ffebb9d702cc8d.js | 0.33 |

#### 3.4.3 Service worker

- ngsw-config.json tiene installMode=prefetch para app e incluye /*.js y /*.css.
- Esto puede anular beneficios de lazy loading, descargando chunks al inicio.

#### 3.4.4 Optimización de imágenes

- Se observa un asset grande: src/assets/images/not-found.gif (~1.31 MiB).

### 3.5 Testing

- **Unit tests:** 97 archivos *.spec.ts bajo src/app.
- **E2E:** 1 spec(s) en e2e (Protractor).
- **Cobertura:** no se encontró carpeta coverage en el repo; jest.config.js apunta a coverageDirectory='reports'.

### 3.6 Código & Calidad

- **Linting:** TSLint=sí; ESLint=no
- **Code smells observados:** uso extendido de any, side-effects en guards, uso de localStorage para tokens, uso de moment/jquery.

## Parte 4: Roadmap de Remediación

### FASE 1 - Security Fixes (2-3 semanas)
- Resolver vulnerabilidades npm sin breaking changes (npm audit fix; luego fixes manuales).
- Hardening Auth: expiración token, refresh, logout cleanup, evitar localStorage.
- Revisar interceptors para robustez y manejo de errores GraphQL/HTTP consistente.

### FASE 2 - Modernización de Stack (4-6 semanas)
- Angular 10 → 14 (primero) → 18.
- TypeScript upgrade alineado.
- RxJS 6 → 7.

### FASE 3 - Refactorización de Arquitectura (4-6 semanas)
- Revisar lazy loading real (service worker config + route-level splitting).
- Memory leak fixes (estandarizar untilDestroyed).
- Refactor services: storage service, auth interceptor, separar responsabilidades.

### FASE 4 - Testing & QA (3-4 semanas)
- Objetivo: cobertura 70%+ en core/shared críticos.
- Migrar E2E Protractor → Cypress/Playwright.
- Performance regression checks (budgets, bundle analysis).

## Recomendaciones específicas (accionables)

Total: 30

1. Actualizar Angular por etapas (10→11→12→13→14→15→16→17→18) usando ng update; priorizar salto a 14 primero.
2. Actualizar TypeScript de ~3.9 a 4.x junto con Angular intermedio; finalizar en TS 5.x con Angular 17/18.
3. Actualizar RxJS 6.5 → 6.6 → 7.x según compatibilidad de Angular; revisar breaking changes en operadores.
4. Reemplazar moment por date-fns/dayjs para reducir bundle (date-fns ya existe).
5. Eliminar jquery y dependencias asociadas; migrar a APIs nativas/directivas Angular.
6. Reemplazar apollo-client v2 + apollo-link* por @apollo/client moderno (o Apollo Angular actualizado).
7. Evitar guardar tokens en localStorage: usar cookies HttpOnly+Secure+SameSite y protección CSRF.
8. Implementar expiración/refresh del token; isLoggedIn() debe validar expiración, no solo existencia.
9. En ApiPrefixInterceptor, manejar JSON.parse del token con try/catch y definir contrato estricto del token.
10. En ApiPrefixInterceptor, robustecer acceso a results.body.errors (null checks) y no asumir estructura.
11. Evitar side-effects en guards; usar resolvers/AppInitializer para perfil/permisos.
12. En PermissionGuard, redirigir a ruta 403/unauthorized y registrar telemetría (mejor auditoría/UX).
13. Separar interceptors: uno para api-prefix y otro solo para auth header/refresh.
14. Centralizar acceso a local/session storage en un StorageService (facilita migración a cookies/memory).
15. Validar/sanitizar inputs antes de enviarlos (especialmente payloads GraphQL).
16. Estandarizar error handling: devolver throwError en interceptors; mapear errores a mensajes UI.
17. Activar strict type-checking gradualmente (noImplicitAny/strictNullChecks/strictTemplates).
18. Generar tipos GraphQL (codegen) para reemplazar any en queries/mutations.
19. Establecer estándar de subscriptions: untilDestroyed/takeUntil obligatorio en streams largos.
20. Auditar ~220 subscribe() y asegurar teardown (router events, valueChanges, interval, etc.).
21. Cambiar ngsw-config para no prefetch todos los chunks; separar assetGroups y usar installMode=lazy para chunks.
22. Habilitar budgets en angular.json y alertar/fallar build por tamaño excesivo.
23. Optimizar assets: comprimir not-found.gif o convertir a webp/mp4; usar imágenes responsivas.
24. Adoptar OnPush en componentes de listas/tablas y usar trackBy en *ngFor.
25. Revisar imports de ng-zorro para importar módulos específicos y reducir bundle.
26. Migrar Protractor (deprecado) a Cypress o Playwright; mantener smoke tests E2E críticos.
27. Añadir unit tests para AuthGuard/PermissionGuard e interceptors; cubrir flujos de auth.
28. Configurar reportes de cobertura (Jest/Karma) en CI y fijar umbrales.
29. Migrar de TSLint a ESLint (Angular ESLint) por soporte; retirar codelyzer.
30. Agregar reglas de seguridad (eslint-plugin-security) y RxJS linting (eslint-plugin-rxjs).

## Referencias / Artefactos del audit

- npm audit (texto): /tmp/npm-audit.txt
- npm audit (json): /tmp/npm-audit.json
- any locations (json): /tmp/any-locations.json
- bundle stats: dist/stats.json (generado con npx ng build --stats-json; requiere NODE_OPTIONS=--openssl-legacy-provider en Node moderno)
