import { IToken } from "./../interfaces/sintegra.interface";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, throwError } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Injectable({ providedIn: 'root' })
export class ServidorProvider {
  _url: string = "https://api.afkgestao.com.br/kazan/"; //TODO voltar versao anterior
  //_url: string = 'https://www.afkgestao.com.br/kazan/';
  // _url: string = 'http://localhost/kazan/';
  //_url: string = 'http://192.168.10.10:8000/';

  constructor(public http: HttpClient) {}

  post(pagina: string, parametro: any): Observable<any> {
    let headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    return this.http
      .post(this._url + pagina, parametro, { headers: headers })
      .pipe(
        map((res) => {
          console.log("Resposta Req" + JSON.stringify(res));
          return res;
        }),
        catchError((error) => {
          console.error("Erro ao fazer a requisição:", error);
          throw throwError(error.message || "Erro no servidor");
        })
      );
  }

  get(pagina: string) {
    //console.log(this._url + pagina);
    let headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    return this.http
      .get(this._url + pagina, { headers: headers })
      .pipe(
        map((res) => res)
      );
  }

  getSint(urlS: string): Observable<any> {
    return this.http
      .get(urlS)
      .pipe(map((res) => res));
  }

  getToken(): Observable<IToken> {
    return this.http.get(this._url + "kazan.php").pipe(map((res) => res as IToken));
  }
}
