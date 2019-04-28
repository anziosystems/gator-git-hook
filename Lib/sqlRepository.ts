let sql = require('mssql');
import {sqlConfigSetting} from './sqlConfig';
import * as _ from 'lodash';

class PullRequest {
  Org: string;
  Login: string;
  Action: string;
  PullRequestId: number;
  PullRequestUrl: string;
  State: string;
  Avatar_Url: string;
  User_Url: string;
  Created_At: string;
  Body: string;
  Teams_Url: string;
  Repo_Name: string;
  Repo_FullName: string;
  Repo_Description: string;
  Links: string;
  PullId: string;
  Title: string;
 
}

class SQLRepository {
  pr: PullRequest;
  raw: string;
  pool: any;

  constructor(obj: any) {
    //for get there may not be any obj
    if (obj) {
      this.pr = this.shredObject(obj);
      this.raw = obj.body;
    }
    this.createPool();
  }

  async createPool() {
    if (!this.pool) {
      await new sql.ConnectionPool(sqlConfigSetting).connect().then((pool: any) => {
        this.pool = pool;
      });
    }
  }
  async savePullRequestDetail(): Promise<any> {
    try {
      await this.createPool();
      let values = `'${this.pr.Org}', '${this.pr.Login}','${this.pr.Action}','${this.pr.PullRequestId}','${this.pr.PullRequestUrl}','${this.pr.State}','${this.pr.Avatar_Url}','${this.pr.User_Url}','${this.pr.Created_At}','${this.pr.Body}','${this.pr.Teams_Url}','${this.pr.Repo_Name}','${this.pr.Repo_FullName}','${this.pr.Repo_Description}','${this.pr.Links}','${this.pr.PullId}','${this.pr.Title}' `;
      const request = await this.pool.request();
      return new Promise((resolve, reject) => {
        request.query(`insert into [PullRequestDetails] ([org],[login], [Action],[PullRequestId],[PullRequestUrl],[State],[Avatar_Url], [User_Url],[Created_At], [Body],[Teams_Url], [Repo_Name], [Repo_FullName], [Repo_Description],[Links], [PullId], [title]    ) values (${values})`).then(
          (data: any) => {
            resolve(data.rowsAffected[0]);
          },
          (error: any) => {
            reject(error);
          },
        );
      });
    } catch (err) {
        if (err.number === 2601) {
            console.log('savePullRequestDetail: ' + err); //Duplicate Record
        }
      console.log(err);
    }
  }

  // async savePullRequestRaw(): Promise<any> {
  //   try {
  //     await this.createPool();
  //     const s = JSON.stringify(this.raw);
  //     let values = `'${this.pr.TenantId}','${this.pr.PullRequestId}','${s}' `;
  //     const request = await this.pool.request();
  //     return new Promise((resolve, reject) => {
  //       request.query(`insert into [PullRequestRaw] values (${values})`).then(
  //         (data: any) => {
  //           resolve(data.rowsAffected[0]);
  //         },
  //         (error: any) => {
  //           reject(error);
  //         },
  //       );
  //     });
  //   } catch (err) {
  //       if (err.number === 2601) {
  //           console.log('savePullRequestRaw: ' + err); //Duplicate Record
  //       }
  //     console.log(err);
  //   }
  // }

  async saveGitLogin(): Promise<any> {
    try {
      await this.createPool();
      let values = `'${this.pr.Org}','${this.pr.Login}','${this.pr.Login}','${this.pr.Avatar_Url}' `;
      const request = await this.pool.request();
      const data = await request.query(`insert into [GitLogin] ([Org],[Login],[FullName],[Avatar_Url] )values (${values})`);
      return data.rowsAffected[0];
    } catch (err) {
        if (err.number === 2601) {
            console.log('saveGitLogin: ' + err); //Duplicate Record
        }
        //throw error
      console.log('saveGitLogin: ' + err); 
    }
  }

  async setItem() {
    try {
      const first = this.savePullRequestDetail();
      const second = this.saveGitLogin();
 
      const [a, b] = await Promise.all([first, second]);
      return {a, b};
      console.log(a);
    } catch (err) {
      console.log(err);
    }
  }

  async getItem(query: string, page: number, pageSize: number) {
    try {
      await this.createPool();
      const request = await this.pool.request();
      const rs = await request.query(query);
      let results = rs.recordset;
      if (isNaN(page)) {
        page = 1;
      }
      if (page === 0) {
        page = 1;
      }
      if (isNaN(pageSize)) {
        pageSize = 10;
      }
      if (pageSize === 0) {
        pageSize = 10;
      }

      let s: string = '[';
      let ctr: number = 0;
      let startCtr: number = (page - 1) * pageSize;
      if (startCtr === 0) {
        startCtr = 1;
      }
      let endCtr: number = page * pageSize;

      if (endCtr > results.length) {
        endCtr = results.length;
      }

      for (let result of results) {
        ctr = ctr + 1;
        if (ctr >= startCtr && ctr <= endCtr) {
          s = s + JSON.stringify(result);
          if (ctr < endCtr) {
            s = s + ','; //last element does not need the comma
          }
        }
      }
      s = s + ']';
      return s;
    } catch (err) {
      console.log(err);
    }
  }

  private shredObject(obj: any): PullRequest {
    let pr: PullRequest = new PullRequest();

    try {
      pr.Org = _.get(obj.body, 'organization.login');
      pr.Login = _.get(obj.body, 'pull_request.user.login');
      pr.Title = _.get(obj.body, 'pull_request.title');
      pr.Action = _.get(obj.body, 'action');
      pr.PullRequestId = parseInt(_.get(obj.body, 'number'));
      pr.PullRequestUrl = _.get(obj.body, 'pull_request.url');
      pr.State = _.get(obj.body, 'pull_request.state');
      pr.Avatar_Url = _.get(obj.body, 'pull_request.user.avatar_url');
      pr.User_Url = _.get(obj.body, 'pull_request.user.url');
      pr.Created_At = _.get(obj.body, 'pull_request.created_at');
      pr.Body = _.get(obj.body, 'pull_request.body');
      pr.Teams_Url = _.get(obj.body, 'pull_request.base.repo.teams_url');
      pr.Repo_Name = _.get(obj.body, 'pull_request.base.repo.name');
      pr.Repo_FullName = _.get(obj.body, 'pull_request.base.repo.full_name');
      pr.Repo_Description = _.get(obj.body, 'pull_request.base.repo.description');
      pr.Links = JSON.stringify( _.get(obj.body, 'pull_request._links'));
      pr.PullId = _.get(obj.body, 'pull_request.url');
    } catch (err) {
      console.log(err);
    }

    return pr;
  }
}

export {SQLRepository};
