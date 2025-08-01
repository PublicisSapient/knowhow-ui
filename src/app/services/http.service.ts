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

import { Injectable, Inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, of, forkJoin, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { APP_CONFIG, IAppConfig } from './app.config';
import { Router } from '@angular/router';
import { Account } from '../model/Account';
import { KPIScore } from '../model/KPIScore';
import { ScoreCard } from '../model/ScoreCard';
import { NotificationResponseDTO } from '../model/NotificationDTO.model';
import {
  UserAccessApprovalResponseDTO,
  UserAccessReqPayload,
} from '../model/userAccessApprovalDTO.model';
import { SharedService } from './shared.service';
import { UserNameRequestDTO } from '../model/UserNameRequestDTO';
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  public currentVersion = '';
  public loadApp = new BehaviorSubject(false);
  public unauthorisedAccess = false;
  public createdProjectName = '';
  /*use to change the base url according to the environment variable */
  private baseUrl = environment.baseUrl; // Servers Env
  private filterDataUrl = this.baseUrl + '/api/filterdata';
  private getDataUrl = this.baseUrl + '/api/'; // URL to web api
  private masterDataUrl = this.baseUrl + '/api/masterData';
  private downloadAllKpiReportUrl = this.baseUrl + '/api/v1/kpi';
  private downloadKpiWiseReportUrl = this.baseUrl + '/api/v1/kpi';
  private logoutUrl = this.baseUrl + '/api/userlogout';
  private centralUserLogoutUrl = this.baseUrl + '/api/centralUserlogout';
  private configDetailsUrl = this.baseUrl + '/api/configDetails';
  private enginneringMaturityUrl = this.baseUrl + '/api/v1/enggMaturity';
  private enginneringMaturityTableUrl = this.baseUrl + '/api/emm/tableview';
  private configUrl = this.baseUrl + '/api/project';
  private getDefaultDataUrl = this.baseUrl + '/api/globalconfigurations/dojo';
  private getCustomApiPropertiesUrl = this.baseUrl + '/api/project/customapi';
  private saveConfigurl = this.baseUrl + '/api/project/usercache/cacheproject';
  private uploadUrl = this.baseUrl + '/api/file/upload';
  private uploadedImageUrl = this.baseUrl + '/api/file/logo';
  private deleteImageUrl = this.baseUrl + '/api/file/delete';
  private registrationUrl = this.baseUrl + '/api/registerUser';
  private standardloginUrl = this.baseUrl + '/api/login';
  private ldapLoginUrl = this.baseUrl + '/api/ldap';
  private crowdSsoLoginLoginUrl = this.baseUrl + '/api/login/crowdsso';
  private getMatchVersionsUrl = this.baseUrl + '/api/getversionmetadata';
  private enggMaturityChildByParentUrl =
    this.baseUrl + '/api/account/project/all';
  private enggMaturitykpiScoreMasterUrl =
    this.baseUrl + '/api/account/project/score-card/all';
  private enggMaturityKpiScoreUrl =
    this.baseUrl + '/api/account/project/score-card/kpi-score';
  private enggMaturitySavekpisUrl =
    this.baseUrl + '/api/account/project/score-card/kpi-score/save';
  private enggMaturityAllKpisUrl = this.baseUrl + '/api/kpi/all';
  private forgotPasswordEmailUrl = this.baseUrl + '/api/forgotPassword';
  private resetPasswordUrl = this.baseUrl + '/api/resetPassword';
  private getRolesUrl = this.baseUrl + '/api/roles';
  private raiseAccessRequestsUrl = this.baseUrl + '/api/accessrequests';
  private getAccessRequestsUrl = this.baseUrl + '/api/accessrequests/status';
  private getAccessRequestNotificationsUrl =
    this.baseUrl + '/api/accessrequests/Pending/notification';
  private updateRequestsUrl = this.baseUrl + '/api/accessrequests';
  private getUserAccessRequestsUrl = this.baseUrl + '/api/accessrequests/user';
  private getScenariosUrl = this.baseUrl + '/api/scenario';
  private getCapacityUrl = this.baseUrl + '/api/capacity';
  private getTestExecutionUrl = this.baseUrl + '/api/testexecution';
  private updateKanbanScenariosUrl = this.baseUrl + '/api/kanbanscenario';
  private getProcessorDataUrl = this.baseUrl + '/api/processor';
  private getServerRoleUrl =
    this.baseUrl + '/api/globalconfigurations/dojo/centralConfig';
  private runProcessorUrl = this.baseUrl + '/api/processor/trigger';
  private changePasswordUrl = this.baseUrl + '/api/changePassword';
  private getAllProjectsUrl = this.baseUrl + '/api/basicconfigs/all';
  private deleteProjectUrl = this.baseUrl + '/api/basicconfigs';
  private getAllUsersUrl = this.baseUrl + '/api/userinfo';
  private updateAccessUrl = this.baseUrl + '/api/userinfo/updateUserRole';
  private deleteAccessUrl = this.baseUrl + '/api/userinfo/deleteUser';
  private notificationPreferencesUrl =
    this.baseUrl + '/api/userinfo/notificationPreferences';
  private getKPIConfigMetadataUrl =
    this.baseUrl + '/api/editConfig/jira/editKpi/';
  /** KnowHOW Lite */
  private basicConfigUrl = this.baseUrl + '/api/basicconfigs';
  private connectionUrl = this.baseUrl + '/api/connections';
  private fieldMappingsUrl = this.baseUrl + '/api/tools';
  private getKPIFieldMappingRelationshipsUrl =
    this.baseUrl + '/api/kpiFieldMapping';
  private getAllBoardsUrl = this.baseUrl + '/api/jira/board';
  private getHierarchyLevelsUrl = this.baseUrl + '/api/hierarchylevels';

  /** Download EMM Excel Sheet Url */
  private getEmmExcelUrl = this.baseUrl + '/api/emm/download';
  private getEmmHistoryUrl = this.baseUrl + '/api/emm-history';
  private getEmmStatsUrl = this.baseUrl + '/api/emm-upload/monthly-stats';
  private getPreCalculatedConfigUrl =
    this.baseUrl + '/api/pre-calculated-config';
  private getADConfigUrl = this.baseUrl + '/api/activedirectory';
  private getSuggestionsUrl = this.baseUrl + '/api/suggestions/project';
  private updateSuggestionsUrl = this.baseUrl + '/api/suggestions/account/';
  private getEmm360Url = this.baseUrl + '/api/emm-feed/download';

  private landingInfoUrl =
    'https://setup-speedy.tools.publicis.sapient.com/landingpage/staticcontent';
  private feedbackCategoryUrl = this.baseUrl + '/api/feedback/categories';
  private submitFeedbackUrl = this.baseUrl + '/api/feedback/submitfeedback';
  private overallSummaryUrl =
    this.baseUrl + `/api/landingpage/dojo/projectsummary`;
  private usersCountUrl = this.baseUrl + '/api/landingpage/userscount';
  private autoApproveUrl = this.baseUrl + '/api/autoapprove';
  private saveShowHideKpiUrl =
    this.baseUrl + '/api/user-board-config/saveAdmin';
  private newUserAccessRequestUrl = this.baseUrl + '/api/userapprovals';
  private sonarVersionURL = this.baseUrl + '/api/sonar/version';
  private projectKeyRequestUrl = this.baseUrl + '/api/sonar/project';
  private branchListRequestUrl = this.baseUrl + '/api/sonar/branch';
  private processorTraceLogsUrl = this.baseUrl + '/api/processor/tracelog';
  private zephyrCloudUrl = this.baseUrl + '/api/testconnection/zephyrcloudurl';
  private bambooPlanUrl = this.baseUrl + '/api/bamboo/plans';
  private bambooBranchUrl = this.baseUrl + '/api/bamboo/branches';
  private bambooDeploymentProjectsUrl = this.baseUrl + '/api/bamboo/deploy';
  private jenkinsJobNameUrl = this.baseUrl + '/api/jenkins/jobName';
  private azurePipelineUrl = this.baseUrl + '/api/azure/pipeline';
  private azureReleasePipelineUrl = this.baseUrl + '/api/azure/release';
  private allHierachyLevelsUrl = this.baseUrl + '/api/filters';
  private getSSOUserInfoUrl = this.baseUrl + '/api/sso/user';
  private authDetailsUrl = this.baseUrl + '/api/authdetails';
  private generateTokenUrl = this.baseUrl + '/api/exposeAPI/generateToken';
  private getCommentUrl = this.baseUrl + '/api/comments/getCommentsByKpiId';
  private submitCommentUrl = this.baseUrl + '/api/comments/submitComments';
  private deleteCommentUrl = this.baseUrl + '/api/comments/deleteCommentById';
  private getCommentCountUrl = this.baseUrl + '/api/comments/getCommentCount';
  private getJiraProjectAssigneUrl = this.baseUrl + '/api/jira/assignees';
  private getAssigneeRolesUrl = this.baseUrl + '/api/capacity/assignee/roles';
  private getAssingeeEmailsUrl =
    this.baseUrl + '/api/repotool/assignees/email/';
  private saveAssigneeForProjectUrl = this.baseUrl + '/api/capacity/assignee';
  private uploadCert = this.baseUrl + '/api/file/uploadCertificate';
  private commentsSummaryUrl = this.baseUrl + '/api/comments/commentsSummary';
  private jiraTemplateUrl = this.baseUrl + '/api/templates';
  private jiraConfigurationUrl = this.baseUrl + '/api/configuration';
  private currentUserDetailsURL = this.baseUrl + '/api/userinfo/userData';
  private getKpiColumnsUrl = this.baseUrl + '/api/kpi-column-config';
  private postKpiColumnsConfigUrl =
    this.baseUrl + '/api/kpi-column-config/kpiColumnConfig';
  private gitActionWorkflowNameUrl =
    this.baseUrl + '/api/githubAction/workflowName';
  private saveHappinessIndexForSprintUrl =
    this.baseUrl + '/api/capacity/jira/happiness';
  userName: string;
  userEmail: string;
  private activeIterationUrl = this.baseUrl + '/api/processor/fetchSprint';
  private activeIterationfetchStatusUrl =
    this.baseUrl + '/api/activeIteration/fetchStatus';
  private fetchUserDetailsUrl = this.baseUrl + '/api/fetchUserDetails';
  private getShowHideKpiUrl = this.baseUrl + '/api/user-board-config';
  private getShowHideKpiNewUIUrl =
    this.baseUrl + '/api/user-board-config/getBoardConfig';
  private recommendationsUrl = this.baseUrl + '/api/kpiRecommendation';
  private urlShortener = this.baseUrl + '/api/stringShortener/shorten';
  private urlRestore = this.baseUrl + '/api/stringShortener/longString';
  private createReportUrl = this.baseUrl + '/api/reports';
  private fetchReportsUrl = this.baseUrl + '/api/reports?createdBy=';

  currentUserDetails = null;
  private saveMetaDataStepURL = this.baseUrl + '/api/processor/metadata/step/';

  private organizationHierarchy = this.baseUrl + '/api/hierarchy';
  private updateHierarchyOptionsUrl = this.baseUrl + '/api/hierarchy';
  private summariseSprintGoalsUrl =
    this.baseUrl + '/api/ai/sprint-goals/summary';
  private llidUrl = this.baseUrl + '/api/usermanagement/save';
  private aiKpiSearchUrl = this.baseUrl + '/api/ai/kpisearch';
  private shareViaEmailUrl: string =
    this.baseUrl +
    '/api/notifications/email?templateKey=recommendation-email&notificationSubjectKey=recommendation-email'; // TODO: Add proper api endpoint here

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(APP_CONFIG) private config: IAppConfig,
    private sharedService: SharedService,
  ) {}

  setCurrentUserDetails(details) {
    if (
      !this.currentUserDetails ||
      !details ||
      Object.keys(details).length === 0
    ) {
      this.currentUserDetails = details;
    } else {
      this.currentUserDetails = { ...this.currentUserDetails, ...details };
    }
    this.userName = this.currentUserDetails['user_name'];
    this.userEmail = this.currentUserDetails['user_email'];
    localStorage.setItem(
      'currentUserDetails',
      JSON.stringify(this.currentUserDetails),
    );
  }

  /** getFilterData from the server */
  getFilterData(filterRequestData): Observable<object> {
    return this.http.post<object>(this.filterDataUrl, filterRequestData);
  }

  getAssigneeEmails(basicConfigId): Observable<any> {
    return this.http.get(this.getAssingeeEmailsUrl + basicConfigId);
  }

  /** get individual kpi excel report from the server */
  downloadExcel(downloadKpiReport, kpiId): Observable<object> {
    return this.http.post<object>(
      this.downloadKpiWiseReportUrl + '/' + kpiId,
      downloadKpiReport,
    );
  }

  /** get EMM Excel report from the server */
  downloadEmmExcel() {
    return this.http.get(this.getEmmExcelUrl);
  }

  downloadEmm360() {
    return this.http.get(this.getEmm360Url, { responseType: 'text' });
  }

  /** GET getMasterData from the server */
  getDefaultData(toolName): Observable<any> {
    return this.http.get(this.getDefaultDataUrl + '/' + toolName);
  }

  /** GET Property File Config from the server */
  getPropertiesConfig(): Observable<any> {
    return this.http.get(this.getCustomApiPropertiesUrl);
  }

  editSavedConfig(username, requestData): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('userId', username);
    return this.http.put(this.saveConfigurl, requestData, { headers });
  }

  SaveConfig(username, requestData): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('userId', username);
    return this.http.post(this.saveConfigurl, requestData, { headers });
  }

  getSavedConfigData(username): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('userId', username);
    return this.http.get(this.saveConfigurl + 's', {
      headers,
    });
  }

  saveOrUpdateSprintHappinessIndex(postData) {
    return this.http.post<any>(this.saveHappinessIndexForSprintUrl, postData);
  }

  /** GET getMasterData from the server */
  getMasterData(): Observable<any> {
    return this.http.get(this.masterDataUrl);
  }

  /** GET getTooltipData from the server */
  getConfigDetails(): Observable<any> {
    return this.http.get(this.configDetailsUrl);
  }

  /** GET getTooltipData from the server */
  getConfigData(): Observable<any> {
    return this.http.get(this.configUrl);
  }

  /** get individual kpi excel report from the server */
  addConfig(requestData): Observable<any> {
    return this.http.post<object>(this.configUrl + '/addOrUpdate', requestData);
  }

  /**
   * @deprecated since 4.0.0
   * delete non-JIRA tools
   *
   */
  deleteTool(requestUrl): Observable<any> {
    return this.http.delete<object>(this.configUrl + requestUrl);
  }

  /**  logout from the server */
  logout(): Observable<any> {
    if (environment?.['AUTHENTICATION_SERVICE']) {
      this.logoutUrl = this.centralUserLogoutUrl;
    }
    return this.http.get(this.logoutUrl);
  }

  // choose method while submitting form from login screen
  getRouteUrl(provider) {
    if (provider === 'STANDARD' || provider === '') {
      return this.standardloginUrl;
    }
    if (provider === 'LDAP') {
      return this.ldapLoginUrl;
    }
  }

  /** POST: login user */
  login(provider = '', username, password): Observable<object> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append(
      'Content-Type',
      'application/x-www-form-urlencoded',
    );
    const loginUrl = this.getRouteUrl(provider);
    // set resquest header
    const httpOptions = {
      headers,
      observe: 'response' as 'response',
    };
    // encode the username and password
    const data = { username, password };
    const str = [];
    for (const p in data) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(data[p]));
    }
    const postData = str.join('&');
    /* Send request to server and store token and username in localstore for authentication */
    return this.http.post<any>(loginUrl, postData, httpOptions).pipe(
      tap((res) => {
        this.setCurrentUserDetails(res.body);
      }),
      catchError(this.handleError<object>('errorData', ['error'])),
    );
  }

  /** POST: Register the user with username,password and email */
  register(username, password, email): Observable<object> {
    const postData = { username, password, email };
    /* Send request to server and store token and username in localstore for authentication */
    return this.http.post<any>(this.registrationUrl, postData).pipe(
      tap((res) => {
        if (res !== 'email' && res !== 'username' && res !== 'password') {
          this.setCurrentUserDetails({ user_name: username });
          this.setCurrentUserDetails({ user_email: email });
          if (res['authorities']?.length > 0) {
            this.setCurrentUserDetails({
              authorities: res['authorities'],
            });
          }
          if (res['projectsAccess']) {
            this.setCurrentUserDetails({
              projectsAccess: res['projectsAccess'],
            });
          }
        }
      }),
    );
  }

  /**POST forgot password  request */
  forgotPassword(email): Observable<object> {
    const postData = { email };
    return this.http
      .post(this.forgotPasswordEmailUrl, postData)
      .pipe(tap((res) => {}));
  }

  /** POST: Change the password for loggedin user*/
  changePassword(oldpassword, password): Observable<any> {
    const postData = {
      oldPassword: oldpassword,
      password,
      email: this.userEmail,
      user: this.userName,
    };
    if (environment?.['AUTHENTICATION_SERVICE']) {
      this.changePasswordUrl = this.baseUrl + '/api/changePassword/central';
    }
    return this.http
      .post(this.changePasswordUrl, postData)
      .pipe(tap((res) => {}));
  }

  /**POST update password */
  updatePassword(password, resetToken) {
    const postData = { password, resetToken };
    return this.http
      .post(this.resetPasswordUrl, postData)
      .pipe(tap((res) => {}));
  }

  /** POST: This make kpi call of scrum */
  postKpi(data, source): Observable<any> {
    return this.http
      .post<any>(this.getDataUrl + source + '/kpi', data)
      .pipe(catchError(this.handleKpiError));
  }

  /** POST: This make kpi call for Iterartion/Backlog/Release tabs */
  postKpiNonTrend(data, source): Observable<any> {
    return this.http
      .post<any>(this.getDataUrl + source + '/nonTrend' + '/kpi', data)
      .pipe(catchError(this.handleKpiError));
  }

  /** POST: This makes kpi call of kanban */
  postKpiKanban(data, source): Observable<object> {
    return this.http
      .post<object>(this.getDataUrl + source + 'kanban/kpi', data)
      .pipe(catchError(this.handleKpiError));
  }

  /** POST: Makes call to get data of Enginnering maturity  */
  getEnginneringMaturityData(data): Observable<object> {
    return this.http.post<object>(this.enginneringMaturityUrl, data);
  }

  /** POST: Makes call to get data of Enginnering maturity  */
  getEnginneringMaturityTableData(data): Observable<object> {
    return this.http.post<object>(this.enginneringMaturityTableUrl, data);
  }

  /** POST: Upload image file of dashboard configuration */
  uploadImage(file): Observable<object> {
    /*set form data*/
    const fileFormData = new FormData();
    fileFormData.append('file', file);
    /*send request*/
    return this.http
      .post<object>(this.uploadUrl, fileFormData)
      .pipe(tap((res) => {}));
  }
  /** get uploaded image file */
  getUploadedImage(): Observable<object> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');

    return this.http
      .get(this.uploadedImageUrl, { headers })
      .pipe(tap((res) => {}));
  }

  /** get uploaded image file */
  deleteImage(): Observable<object> {
    return this.http.get(this.deleteImageUrl).pipe(tap((res) => {}));
  }

  /** GET getVersionData from the server */

  getMatchVersions(): Observable<any> {
    return this.http.get(this.getMatchVersionsUrl).pipe(
      tap((getData) => {
        this.currentVersion = getData['versionDetailsMap']['currentVersion'];
      }),
    );
  }

  /** fetch all the project from account id */
  getAllProjectsOfAnAccount(accountID): Observable<object> {
    return this.http
      .get<any>(this.enggMaturityChildByParentUrl)
      .pipe(
        tap((projects) =>
          projects.map(
            (project) =>
              new Account({ id: project.id, name: project.nodeName }),
          ),
        ),
      );
  }

  /** fetch all the project from account ids */
  getAllProjectsOfAnAccounts(accountID, levelName): Observable<Account[]> {
    return this.http
      .get<any>(
        this.enggMaturityChildByParentUrl + '/' + accountID + '/' + levelName,
      )
      .pipe(
        map((projects) =>
          projects.map(
            (project) =>
              new Account({ id: project.id, name: project.nodeName }),
          ),
        ),
      );
  }
  /** fetch all the kpi master data according to project id */
  getProjectEnggMaturityScoreCards(projectID): Observable<any[]> {
    return this.http
      .get<any>(this.enggMaturitykpiScoreMasterUrl + '/' + projectID)
      .pipe(
        map((scoreCards) =>
          scoreCards.map(
            (scoreCard) =>
              new ScoreCard({
                id: scoreCard.id,
                projectID: scoreCard.accountHierarchyId,
                created: scoreCard.created,
                lastUpdated: scoreCard.lastUpdated,
              }),
          ),
        ),
      );
  }

  /** fetch the kpi score by scorecard master id */
  getProjectEnggMaturityKPIScores(scoreCardID): Observable<object> {
    return this.http
      .get<any>(this.enggMaturityKpiScoreUrl + '/' + scoreCardID)
      .pipe(
        map((KPIScores) =>
          KPIScores.map(
            (kpiScore) =>
              new KPIScore({
                id: kpiScore.id,
                scoreCardID: kpiScore.accountHierarchyKpiScoreMasterId,
                kpiID: kpiScore.kpiId,
                kpiScore: kpiScore.score,
                kpiMaturity: kpiScore.maturity,
              }),
          ),
        ),
      );
  }

  /** Save and update the enggmaturity data */
  addEnggMaturityKPIScoreForProject(projectKPIScoreData: {}): Observable<object> {
    return this.http
      .post<any>(this.enggMaturitySavekpisUrl, projectKPIScoreData)
      .pipe(tap((response) => response));
  }

  /** get all kpi data */
  getAllEnggMaturityKpi() {
    return this.http
      .get<any>(this.enggMaturityAllKpisUrl)
      .pipe(map((projects) => projects));
  }

  /** get all roles for RBAC */
  getRolesList() {
    return this.http.get<any>(this.getRolesUrl).pipe(map((roles) => roles));
  }

  /** get all projects for RBAC */
  getAllProjects() {
    return this.http.get<any>(this.getAllProjectsUrl);
  }

  /** get all users for RBAC */
  getAllUsers() {
    return this.http.get<any>(this.getAllUsersUrl);
  }

  /** Update access (RBAC) */
  updateAccess(requestData): Observable<any> {
    return this.http.post(this.updateAccessUrl, requestData);
  }

  /** Change Notification Preferences toggle  */
  notificationEmailToggleChange(notificationEmailObj): Observable<any> {
    return this.http.post<any>(
      this.notificationPreferencesUrl,
      notificationEmailObj,
    );
  }

  /** get all requests for access (RBAC) */
  getAccessRequests(status) {
    return this.http
      .get<any>(this.getAccessRequestsUrl + '/' + status)
      .pipe(map((requests) => requests));
  }

  /** get pending request notifications */
  getAccessRequestsNotifications() {
    if (environment?.['AUTHENTICATION_SERVICE']) {
      this.getAccessRequestNotificationsUrl =
        this.baseUrl + '/api/accessrequests/Pending/notification/central';
    }
    return this.http
      .get<NotificationResponseDTO>(this.getAccessRequestNotificationsUrl)
      .pipe(map((requests) => requests));
  }

  /** Save access request (RBAC) */
  saveAccessRequest(requestData): Observable<any> {
    return this.http.post(this.raiseAccessRequestsUrl, requestData);
  }

  /** Delete access request (RBAC) */
  deleteAccessRequest(requestId): Observable<any> {
    return this.http.delete(this.raiseAccessRequestsUrl + '/' + requestId);
  }

  /** Delete User */
  deleteAccess(userNameRequestPayload: UserNameRequestDTO) {
    if (environment?.['AUTHENTICATION_SERVICE']) {
      this.deleteAccessUrl = this.baseUrl + '/api/userinfo/central/deleteUser';
    }
    return this.http.post(this.deleteAccessUrl, userNameRequestPayload);
  }

  /** Accept/Reject access request (RBAC) */
  updateAccessRequest(requestData, requestId): Observable<any> {
    return this.http.put(this.updateRequestsUrl + '/' + requestId, requestData);
  }

  /** Fetch current user's access requests */
  getUserAccessRequests(userName) {
    return this.http
      .get<any>(this.getUserAccessRequestsUrl + '/' + userName)
      .pipe(map((requests) => requests));
  }

  /** Fetch data automation scenarios */
  getScenario() {
    return this.http.get<any>(this.getScenariosUrl);
  }

  /** Save data automation scenario */
  saveScenario(requestData): Observable<any> {
    return this.http.post(this.getScenariosUrl, requestData);
  }

  /** Save capacity */
  saveCapacity(requestData): Observable<any> {
    return this.http.post(this.getCapacityUrl, requestData);
  }

  /** Save Test Execution Percentage */
  saveTestExecutionPercent(requestData): Observable<any> {
    return this.http.post(this.getTestExecutionUrl, requestData);
  }

  /** Delete data automation scenario */
  deleteScenario(requestUrl): Observable<any> {
    return this.http.delete<object>(this.getScenariosUrl + requestUrl);
  }

  /** Update data automation scenario */
  UpdateScenario(requestData): Observable<any> {
    return this.http.put<object>(this.getScenariosUrl, requestData);
  }

  updateKanbanScenario(requestData): Observable<any> {
    return this.http.put<object>(this.updateKanbanScenariosUrl, requestData);
  }

  /** get Processor data */
  getProcessorData(): Observable<any> {
    return this.http.get<any>(this.getProcessorDataUrl);
  }

  /** get Pre calculated config ? */
  getPreCalculatedConfig(): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('httpErrorHandler', 'local');
    return this.http.get<any>(this.getPreCalculatedConfigUrl, { headers });
  }

  /** Run the processor based on processor's name */
  runProcessor(payLoad): Observable<any> {
    return this.http.post<object>(
      this.runProcessorUrl + '/' + payLoad.processor,
      payLoad.projects,
    );
  }

  /** Get KPI Config metadata */
  getKPIConfigMetadata(basicConfigID, kpiid): Observable<any> {
    return this.http.get<any>(
      this.getKPIConfigMetadataUrl + basicConfigID + '/' + kpiid,
    );
  }

  /** KnowHow Lite */

  getProjectListData(): Observable<any[]> {
    const projectList = this.http.get(this.basicConfigUrl);
    return forkJoin([projectList]);
  }

  getUserProjects(queryParams?): Observable<any> {
    return this.http.get(`${this.basicConfigUrl}?${queryParams}`);
  }

  /** add basic config */
  addBasicConfig(basicConfig): Observable<any> {
    this.createdProjectName = basicConfig?.projectName;
    return this.http.post<any>(this.basicConfigUrl, basicConfig);
  }

  /** edit basic config */
  editBasicConfig(basicConfigId, basicConfig): Observable<any> {
    return this.http.put<any>(
      this.basicConfigUrl + '/' + basicConfigId,
      basicConfig,
    );
  }

  /** suggestions for account and project on basic config */
  getAllSuggestions() {
    return this.http.get<any>(this.getSuggestionsUrl);
  }

  /** get hierarchy levels for project creation */
  getHierarchyLevels() {
    return this.http.get<any>(this.getHierarchyLevelsUrl);
  }
  /** Get all connections */
  getAllConnections() {
    return this.http.get(this.connectionUrl);
  }

  /** Get all connections based on type of connection */
  getAllConnectionTypeBased(type: string) {
    return this.http.get(this.connectionUrl + '?type=' + type);
  }

  /** Add Connection */
  addConnection(connection) {
    return this.http.post(this.connectionUrl, connection);
  }

  /** Edit Connection */
  editConnection(connection) {
    return this.http.put(this.connectionUrl + `/${connection.id}`, connection);
  }

  /** Delete Connection */
  deleteConnection(connection) {
    return this.http.delete(this.connectionUrl + `/${connection.id}`);
  }

  /** Fetch list of boards for a project key on JIRA config */
  getAllBoards(boardQueryData) {
    return this.http.post(this.getAllBoardsUrl, boardQueryData);
  }

  /** Get all Tool Configs */
  getAllToolConfigs(basicConfigId): Observable<any> {
    return this.http.get(this.basicConfigUrl + '/' + basicConfigId + '/tools');
  }

  /** Add Tool */
  addTool(basicConfigId, toolConfig) {
    return this.http.post(
      this.basicConfigUrl + '/' + basicConfigId + '/tools',
      toolConfig,
    );
  }

  /** Edit Tool */
  editTool(basicConfigId, toolId, toolConfig) {
    return this.http.put(
      this.basicConfigUrl + '/' + basicConfigId + '/tools/' + toolId,
      toolConfig,
    );
  }

  /** Delete Tool */
  deleteProjectToolConfig(basicConfigId, toolId) {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('httpErrorHandler', 'local');
    return this.http.delete(
      this.basicConfigUrl + '/' + basicConfigId + '/tools/' + toolId,
      { headers },
    );
  }

  /** Delete Project */
  deleteProject(project) {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('httpErrorHandler', 'local');
    return this.http.delete(this.deleteProjectUrl + `/${project.id}`, {
      headers,
    });
  }

  /** Get all Field Mappings */
  getFieldMappings(toolId) {
    return this.http.get(
      this.fieldMappingsUrl + '/' + toolId + '/fieldMapping',
    );
  }

  /** Get all Field Mappings with history */
  getFieldMappingsWithHistory(toolId, kpiId, data): Observable<any> {
    return this.http.post(
      this.fieldMappingsUrl + '/fieldMapping/' + toolId + '/' + kpiId,
      data,
    );
  }

  /** Save all Field Mappings */
  setFieldMappings(toolId, mappingConfig, kpiid, isImport?) {
    if (isImport && isImport === true) {
      return this.http.post(
        this.fieldMappingsUrl + '/' + toolId + '/fieldMapping',
        mappingConfig,
      );
    } else {
      return this.http.post(
        this.fieldMappingsUrl + '/saveMapping/' + toolId + '/' + kpiid,
        mappingConfig,
      );
    }
  }

  /** Get KPI-field mapping relationships */
  getKPIFieldMappingRelationships() {
    return this.http.get<any>(this.getKPIFieldMappingRelationshipsUrl);
  }

  /** get emm upload history */
  getEmmHistory(): Observable<any> {
    return this.http.get<any>(this.getEmmHistoryUrl);
  }

  getEmmStats(): Observable<any> {
    return this.http.get<any>(this.getEmmStatsUrl);
  }

  getSSOUserInfo() {
    return this.http.get<any>(this.getSSOUserInfoUrl);
  }

  getAuthDetails() {
    const existingRoles = this.sharedService
      .getCurrentUserDetails('projectsAccess')
      ?.map((projectRolesDetails) => projectRolesDetails?.role);
    this.http.get<any>(this.authDetailsUrl).subscribe((response) => {
      if (response && response?.success && response?.data) {
        const authDetails = response?.data;
        const newRoles = authDetails['projectsAccess']?.map(
          (projectRolesDetails) => projectRolesDetails?.role,
        );
        let roleAlreadyExist = true;
        newRoles?.forEach((role) => {
          if (!existingRoles.includes(role)) {
            roleAlreadyExist = false;
          }
        });
        this.setCurrentUserDetails({
          username: authDetails['username'],
        });
        this.setCurrentUserDetails({
          user_email: authDetails['emailAddress'],
        });
        this.setCurrentUserDetails({
          projectsAccess: authDetails['projectsAccess'],
        });
        this.setCurrentUserDetails({
          notificationEmail: authDetails['notificationEmail'],
        });
        this.setCurrentUserDetails({
          authorities: authDetails['authorities'],
        });
        if (!this.unauthorisedAccess && !roleAlreadyExist) {
          this.loadApp.next(true);
          this.unauthorisedAccess = false;
        }
      }
    });
  }

  generateToken(postData): Observable<any> {
    return this.http.post<any>(this.generateTokenUrl, postData);
  }

  getJiraProjectAssignee(projectId) {
    return this.http.get<any>(this.getJiraProjectAssigneUrl + '/' + projectId);
  }

  getAssigneeRoles() {
    return this.http.get<any>(this.getAssigneeRolesUrl);
  }

  saveOrUpdateAssignee(postData) {
    return this.http.post<any>(this.saveAssigneeForProjectUrl, postData);
  }

  getkpiColumns(projectBasicConfigId, kpiId) {
    return this.http.get(
      this.getKpiColumnsUrl + '/' + projectBasicConfigId + '/' + kpiId,
    );
  }

  postkpiColumnsConfig(postData) {
    return this.http.post(this.postKpiColumnsConfigUrl, postData);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      if (error.status === 401) {
        this.setCurrentUserDetails({});

        this.router.navigate(['./authentication/login']);
      }
      // TODO: send the error to remote logging infrastructure
      // console.log('http', of(result as T)); // log to console instead
      // Let the app keep running by returning an empty result.
      return of(error);
    };
  }

  private handleKpiError(errorResponse: HttpErrorResponse) {
    const errorObj = {};
    if (errorResponse.error instanceof ErrorEvent) {
      // client-side errors
      console.error(errorResponse);
    } else if (errorResponse.status === 403) {
      errorObj['error'] = true;
      errorObj['status'] = errorResponse.status;
      errorObj['message'] = 'No Access!';
      errorObj['url'] = errorResponse.url;
    } else {
      errorObj['error'] = true;
      errorObj['status'] = errorResponse.status;
      errorObj['message'] = 'Some error occurred!';
      errorObj['url'] = errorResponse.url;
    }
    return of(errorObj);
  }

  /**  get landing page additional information data */
  getLandingInfo() {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('httpErrorHandler', 'local');
    return this.http.get<any>(this.landingInfoUrl, { headers });
  }

  /**  get feedback category */
  getFeedbackCategory() {
    return this.http.get<any>(this.feedbackCategoryUrl);
  }

  /** post feedback/idea */
  submitFeedbackData(data): Observable<any> {
    return this.http.post<object>(this.submitFeedbackUrl, data);
  }

  /** get overall Summary */
  getOverallSummary(days?) {
    return this.http.get<any>(
      this.overallSummaryUrl + `${days ? '?days=' + days : ''}`,
    );
  }

  /**  get users count */
  getUsersCount() {
    return this.http.get<any>(this.usersCountUrl);
  }

  /* post auto approve role access */
  submitAutoApproveData(data): Observable<any> {
    if (data.id) {
      return this.http.put<object>(this.autoApproveUrl + '/' + data.id, data);
    } else {
      return this.http.post<object>(this.autoApproveUrl, data);
    }
  }

  /* get auto approved role list */
  getAutoApprovedRoleList() {
    return this.http.get<any>(this.autoApproveUrl);
  }

  /** show-Hide for dashboard config component  */
  getShowHideKpi(projectID) {
    return this.http.get<any>(this.getShowHideKpiUrl + '/' + projectID);
  }
  submitShowHideKpiData(data, projectID): Observable<any> {
    return this.http.post<object>(
      this.saveShowHideKpiUrl + '/' + projectID,
      data,
    );
  }

  /** show-Hide for other nav, filter component */
  getShowHideOnDashboard(payload) {
    return this.http.post<any>(this.getShowHideKpiUrl + '/getConfig', payload);
  }

  /** show-Hide for other nav, filter component in New UI */
  getShowHideOnDashboardNewUI(payload) {
    return this.http.post<any>(this.getShowHideKpiNewUIUrl, payload);
  }

  submitShowHideOnDashboard(data) {
    return this.http.post<any>(this.getShowHideKpiUrl, data);
  }

  getNewUserAccessRequestFromAPI() {
    if (environment?.['AUTHENTICATION_SERVICE']) {
      this.newUserAccessRequestUrl =
        this.baseUrl + '/api/userapprovals/central';
    }
    return this.http.get<UserAccessApprovalResponseDTO>(
      this.newUserAccessRequestUrl,
    );
  }

  updateNewUserAccessRequest(reqBody: UserAccessReqPayload) {
    if (environment?.['AUTHENTICATION_SERVICE']) {
      this.newUserAccessRequestUrl =
        this.baseUrl + '/api/userapprovals/central';
    }
    return this.http.put<any>(`${this.newUserAccessRequestUrl}`, reqBody);
  }

  getProcessorsTraceLogsForProject(basicProjectConfigId) {
    let params = '';

    if (basicProjectConfigId) {
      params = '?basicProjectConfigId=' + basicProjectConfigId;
    }

    const url = params
      ? this.processorTraceLogsUrl + params
      : this.processorTraceLogsUrl;

    return this.http.get<any>(url);
  }

  getSonarVersionList() {
    return this.http.get<any>(`${this.sonarVersionURL}`);
  }

  getProjectKeyList(connectionId: string, organizationKey: string) {
    return this.http.get<any>(
      `${this.projectKeyRequestUrl}/${connectionId}/${organizationKey}`,
    );
  }

  getBranchListForProject(
    connectionId: string,
    version: string,
    projectKey: string,
  ) {
    return this.http.get<any>(
      `${this.branchListRequestUrl}/${connectionId}/${version}/${projectKey}`,
    );
  }

  getZephyrUrl() {
    return this.http.get<any>(this.zephyrCloudUrl);
  }

  getPlansForBamboo(connectionId: string) {
    return this.http.get<any>(`${this.bambooPlanUrl}/${connectionId}`);
  }

  getBranchesForProject(connectionId: string, jobNameKey: string) {
    return this.http.get<any>(
      `${this.bambooBranchUrl}/${connectionId}/${jobNameKey}`,
    );
  }

  getDeploymentProjectsForBamboo(connectionId: string) {
    return this.http.get<any>(
      `${this.bambooDeploymentProjectsUrl}/${connectionId}`,
    );
  }

  getJenkinsJobNameList(connectionId: string) {
    return this.http.get<any>(`${this.jenkinsJobNameUrl}/${connectionId}`);
  }

  getAzurePipelineList(connectionId: string, version: string) {
    return this.http.get<any>(
      `${this.azurePipelineUrl}/${connectionId}/${version}`,
    );
  }

  getAzureReleasePipelines(connectionId: string, version: string) {
    return this.http.get<any>(
      `${this.azureReleasePipelineUrl}/${connectionId}/${version}`,
    );
  }
  getCapacityData(projectId) {
    return this.http.get<any>(`${this.getCapacityUrl}/${projectId}`);
  }
  getTestExecutionData(projectId) {
    return this.http.get<any>(`${this.getTestExecutionUrl}/${projectId}`);
  }
  getAllHierarchyLevels() {
    return this.http.get<any>(`${this.allHierachyLevelsUrl}`);
  }

  deleteProcessorData(toolId, projectId) {
    return this.http.delete(
      this.deleteProjectUrl + `/${projectId}/tools/clean/` + toolId,
    );
  }

  getComment(postData) {
    return this.http.post<any>(this.getCommentUrl, postData);
  }

  submitComment(data): Observable<any> {
    return this.http.post<object>(this.submitCommentUrl, data);
  }

  deleteComment(id): Observable<any> {
    return this.http.delete<object>(this.deleteCommentUrl + '/' + id);
  }

  getCommentCount(data): Observable<any> {
    return this.http.post<object>(this.getCommentCountUrl, data);
  }

  /* Update project details  */
  updateProjectDetails(updatedDetails, id) {
    return this.http.put<any>(this.basicConfigUrl + '/' + id, updatedDetails);
  }

  /** POST: Upload ldap certificate file */
  uploadCertificate(file): Observable<object> {
    const fileFormData = new FormData();
    fileFormData.append('file', file);
    return this.http.post<object>(this.uploadCert, fileFormData);
  }

  getJiraTemplate(projectId) {
    return this.http.get<any>(`${this.jiraTemplateUrl}/${projectId}`);
  }

  getJiraConfigurationTypeOptions() {
    return this.http.get<any>(`${this.jiraConfigurationUrl}`);
  }

  getMappingTemplateFlag(toolID, data) {
    return this.http.post(
      `${this.fieldMappingsUrl}/${toolID}/saveMapping`,
      data,
    );
  }

  getCurrentUserDetails() {
    return this.http.get<any>(this.currentUserDetailsURL);
  }

  /** Get workflow name list for Github Action tool */
  getGitActionWorkFlowName(data) {
    return this.http.post(
      `${this.gitActionWorkflowNameUrl}/${data.connectionID}`,
      data,
    );
  }

  getActiveIterationStatus(postData) {
    return this.http.post(
      this.activeIterationUrl + '/' + postData.sprintId,
      {},
    );
  }

  getactiveIterationfetchStatus(sprintId) {
    return this.http.get(this.activeIterationfetchStatusUrl + '/' + sprintId);
  }
  getCommentSummary(data) {
    return this.http.post<object>(this.commentsSummaryUrl, data);
  }

  /** This method is responsible for getting field mapping configuration for specfic KPI and processor */
  getKPIFieldMappingConfig(KPIID) {
    return this.http.get<any>(
      `${this.getKPIFieldMappingRelationshipsUrl}/${KPIID}`,
    );
  }

  getUserDetailsForCentral() {
    return this.http.get<object>(this.fetchUserDetailsUrl);
  }

  getFeatureFlags() {
    return this.http
      .get<any>(`${this.baseUrl}/api/actuator/togglz`)
      .toPromise();
  }

  getAzureTeams(connectionId) {
    return this.http.get<any>(
      `${this.baseUrl}/api/azure/teams/${connectionId}`,
    );
  }

  getProgressStatusOfProcessors(data) {
    return this.http.get<any>(
      `${this.processorTraceLogsUrl}?processorName=${data.processor}&basicProjectConfigId=${data.projects[0]}`,
    );
  }

  getRecommendations(data) {
    return this.http.post<object>(this.recommendationsUrl, data);
  }

  getOrganizationHierarchy() {
    return this.http.get<any>(this.organizationHierarchy);
  }

  fetchJiramappingBE(basicConfigID) {
    return this.http.post<object>(this.saveMetaDataStepURL + basicConfigID, {});
  }

  handleUrlShortener(payload: any): Observable<object> {
    return this.http.post<any>(this.urlShortener, payload);
  }

  handleRestoreUrl(stateFilterData, kpiFilterData) {
    return this.http.get<any>(
      `${this.urlRestore}?stateFilters=${stateFilterData}&kpiFilters=${kpiFilterData}`,
    );
  }

  createReport(payload: any): Observable<object> {
    return this.http.post<any>(this.createReportUrl, payload);
  }

  updateReport(id: string, payload: any): Observable<object> {
    return this.http.put<any>(this.createReportUrl + '/' + id, payload);
  }

  fetchReports(): Observable<object> {
    let userId = this.currentUserDetails['user_name'];
    //Pagination to be handled
    return this.http.get<object>(
      this.fetchReportsUrl + userId + '&page=0&limit=9999',
    );
  }

  deleteReport(id: string): Observable<any> {
    return this.http.delete<any>(this.createReportUrl + '/' + id);
  }

  addHierarchyOptions(parentID, hierarchyOptions) {
    return this.http.post<any>(
      parentID
        ? `${this.updateHierarchyOptionsUrl}/${parentID}`
        : this.updateHierarchyOptionsUrl,
      hierarchyOptions,
    );
  }

  renameHierarchyOptions(levelId, dispalyName) {
    return this.http.put<any>(
      `${this.updateHierarchyOptionsUrl}/${levelId}`,
      dispalyName,
    );
  }

  summariseSprintGoalsCall(req) {
    return this.http.post<Object>(this.summariseSprintGoalsUrl, req);
  }

  addLLIDUser(llid) {
    return this.http.post<any>(this.llidUrl, { username: llid });
  }

  aiKpiSearch(searchQuery) {
    let params = '';

    if (searchQuery) {
      params = `?query=${searchQuery}`;
    }

    const url = params ? this.aiKpiSearchUrl + params : this.aiKpiSearchUrl;

    return this.http.get<any>(url);
  }

  shareViaEmail(payload) {
    return this.http.post<any>(this.shareViaEmailUrl, payload);
  }
}
