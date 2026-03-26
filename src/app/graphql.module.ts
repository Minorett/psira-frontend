import { NgModule } from '@angular/core';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';
import { setContext } from 'apollo-link-context';
import { environment } from '../environments/environment';

const uri = environment.baseURL;

export function createApollo(httpLink: HttpLink) {
  const auth = setContext(() => {
    const tokenStr = localStorage.getItem('auth_app_token');
    if (!tokenStr) return {};
    try {
      const { accessToken } = JSON.parse(tokenStr);
      return accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : {};
    } catch {
      return {};
    }
  });

  return {
    link: ApolloLink.from([auth, httpLink.create({ uri })]),
    cache: new InMemoryCache(),
  };
}

@NgModule({
  exports: [ApolloModule, HttpLinkModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {}
