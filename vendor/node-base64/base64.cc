/**
 * nodejs(http://github.com/ry/node/) library for base64 encoding(decoding)
 *
 * @package base64
 * @link http://github.com/brainfucker/node-base64
 * @autor Oleg Illarionov <oleg@emby.ru>
 * @version 1.0
 */
 
#include <v8.h>
#include <node.h>
#include <node_buffer.h>

#include <iostream>
#include <stdio.h>
#include <stdlib.h>

using namespace v8;
using namespace node;

static const char base64_table[] = {
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
	'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
	'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/', '\0'
};

static const char base64_pad = '=';

static const short base64_reverse_table[256] = {
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -1, -1, -2, -2, -1, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-1, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, 62, -2, -2, -2, 63,
	52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -2, -2, -2, -2, -2, -2,
	-2,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
	15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -2, -2, -2, -2, -2,
	-2, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
	41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2
};


char* base64_encode(const unsigned char *str, int length, int *ret_length) /* {{{ */
{
	const unsigned char *current = str;
	char *p;
	char *result;

	if ((length + 2) < 0 || ((length + 2) / 3) >= (1 << (sizeof(int) * 8 - 2))) {
		if (ret_length != NULL) {
			*ret_length = 0;
		}
		return NULL;
	}

	result = (char *)malloc((((length + 2) / 3) * 4)*(sizeof(char))+(1));
	if (result == NULL) {
        fprintf(stderr, "out of memory!\n");
        exit(1);
    }
	p = result;

	while (length > 2) {
		*p++ = base64_table[current[0] >> 2];
		*p++ = base64_table[((current[0] & 0x03) << 4) + (current[1] >> 4)];
		*p++ = base64_table[((current[1] & 0x0f) << 2) + (current[2] >> 6)];
		*p++ = base64_table[current[2] & 0x3f];

		current += 3;
		length -= 3;
	}

	if (length != 0) {
		*p++ = base64_table[current[0] >> 2];
		if (length > 1) {
			*p++ = base64_table[((current[0] & 0x03) << 4) + (current[1] >> 4)];
			*p++ = base64_table[(current[1] & 0x0f) << 2];
			*p++ = base64_pad;
		} else {
			*p++ = base64_table[(current[0] & 0x03) << 4];
			*p++ = base64_pad;
			*p++ = base64_pad;
		}
	}
	if (ret_length != NULL) {
		*ret_length = (int)(p - result);
	}
	*p = '\0';
	return result;
}


char *base64_decode(const unsigned char *str, int length, int *ret_length)
{
	const unsigned char *current = str;
	int ch, i = 0, j = 0, k;
	char *result;

	result = (char *)malloc(length+1);
	if (result == NULL) {
        fprintf(stderr, "out of memory!\n");
        exit(1);
    }

	while ((ch = *current++) != '\0' && length-- > 0) {
		if (ch == base64_pad) {
			if (*current != '=' && (i % 4) == 1) {
				free(result);
				return NULL;
			}
			continue;
		}

		ch = base64_reverse_table[ch];
		if ((1 && ch < 0) || ch == -1) {
			continue;
		} else if (ch == -2) {
			free(result);
			return NULL;
		}

		switch(i % 4) {
		case 0:
			result[j] = ch << 2;
			break;
		case 1:
			result[j++] |= ch >> 4;
			result[j] = (ch & 0x0f) << 4;
			break;
		case 2:
			result[j++] |= ch >>2;
			result[j] = (ch & 0x03) << 6;
			break;
		case 3:
			result[j++] |= ch;
			break;
		}
		i++;
	}

	k = j;
	
	if (ch == base64_pad) {
		switch(i % 4) {
		case 1:
			free(result);
			return NULL;
		case 2:
			k++;
		case 3:
			result[k] = 0;
		}
	}
	if(ret_length) {
		*ret_length = j;
	}
	result[j] = '\0';
	return result;
}


Handle<Value>
base64_encode_binding(const Arguments& args)
{
 HandleScope scope;
 int len;
 Local<String> ret;
 if (Buffer::HasInstance(args[0])) {
   Buffer *buffer = ObjectWrap::Unwrap<Buffer>(args[0]->ToObject());
   char *str = base64_encode((unsigned char*)buffer->data(), buffer->length(),&len);
   ret = String::New(str, len);
   delete str;
 } else {
   String::Utf8Value data(args[0]->ToString());
   char* str = base64_encode((unsigned char*)*data,data.length(),&len);
   ret = String::New(str,len);
   delete str;
 }
 return ret;
}


Handle<Value>
base64_decode_binding(const Arguments& args)
{
  HandleScope scope;
  Local<String> ret;
  int len;
  if (Buffer::HasInstance(args[0])) {
    Buffer *buffer = ObjectWrap::Unwrap<Buffer>(args[0]->ToObject());
    char *str = base64_decode((unsigned char*)buffer->data(), buffer->length(),&len);
    ret = String::New(str, len);
    delete str;
  } else {
    String::Utf8Value data(args[0]->ToString());
    char* str=base64_decode((unsigned char*)*data,data.length(),&len);
	  ret = String::New(str,len);
	  delete str;
	}
  return ret;
}


extern "C" void init (Handle<Object> target)
{
  HandleScope scope;

  target->Set(String::New("encode"), FunctionTemplate::New(base64_encode_binding)->GetFunction());
  target->Set(String::New("decode"), FunctionTemplate::New(base64_decode_binding)->GetFunction());
}
