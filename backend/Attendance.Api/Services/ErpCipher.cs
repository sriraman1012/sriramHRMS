using System.Security.Cryptography;
using System.Text;

namespace Attendance.Api.Services;

public interface IErpCipher
{
    string Encrypt(string plain);
    string Decrypt(string encrypted);
}

// Faithful port of the legacy "EncryptandDecrypt" tool (clsCommon.cs).
// Algorithm MUST NOT change — existing stored ERP values depend on it:
//   Key      = MD5("ERP")  (16 bytes → two-key TripleDES)
//   Cipher   = TripleDES, ECB mode, PKCS7 padding
//   Encoding = ASCII
//   Encrypt  = Base64( 3DES( ASCII(text) ) )
//   Decrypt  = ASCII( 3DES-1( Base64Decode( text.Replace(" ", "+") ) ) )
// Verified against the tool's test vectors:
//   sa -> zEGFVqLeHvQ= | Password@123 -> Wos175PoEFd59Pe/XmXMow== | ERP -> INT4/R1BpXM=
public class ErpCipher : IErpCipher
{
    private const string KeySeed = "ERP";

    private static byte[] KeyBytes()
    {
        using var md5 = MD5.Create();
        return md5.ComputeHash(Encoding.ASCII.GetBytes(KeySeed));
    }

    public string Encrypt(string plain)
    {
        plain ??= string.Empty;
        using var des = TripleDES.Create();
        des.Key = KeyBytes();
        des.Mode = CipherMode.ECB;
        des.Padding = PaddingMode.PKCS7;
        var buffer = Encoding.ASCII.GetBytes(plain);
        using var enc = des.CreateEncryptor();
        return Convert.ToBase64String(enc.TransformFinalBlock(buffer, 0, buffer.Length));
    }

    public string Decrypt(string encrypted)
    {
        encrypted ??= string.Empty;
        using var des = TripleDES.Create();
        des.Key = KeyBytes();
        des.Mode = CipherMode.ECB;
        des.Padding = PaddingMode.PKCS7;
        // Base64 may arrive with '+' turned into ' ' by a URL/querystring — undo that.
        var buffer = Convert.FromBase64String(encrypted.Replace(" ", "+"));
        using var dec = des.CreateDecryptor();
        return Encoding.ASCII.GetString(dec.TransformFinalBlock(buffer, 0, buffer.Length));
    }
}
