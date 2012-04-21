from pygments.lexers import get_all_lexers

import simplejson as json

result = json.dumps(map(lambda lexer: {'name':lexer[0], 'alias':lexer[1][0]}, get_all_lexers()))
