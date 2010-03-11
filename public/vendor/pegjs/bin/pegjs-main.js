importPackage(java.io);
importPackage(java.lang);

/*
 * Rhino does not have __FILE__ or anything similar so we have to pass the
 * script path from the outside.
 */
load(arguments[0] + "/../lib/runtime.js");
load(arguments[0] + "/../lib/compiler.js");

var FILE_STDIN  = "-";
var FILE_STDOUT = "-";

function readFile(file) {
  var f = new BufferedReader(new InputStreamReader(
    file === FILE_STDIN ? System["in"] : new FileInputStream(file)
  ));

  var result = "";
  var line = "";
  try {
    while ((line = f.readLine()) !== null) {
      result += line + "\n";
    }
  } finally {
    f.close();
  }

  return result;
}

function writeFile(file, text) {
  var f = new BufferedWriter(new OutputStreamWriter(
    file === FILE_STDOUT ? System.out : new FileOutputStream(file)
  ));

  try {
    f.write(text);
  } finally {
    f.close();
  }
}

function isOption(arg) {
  return /-.+/.test(arg);
}

function printVersion() {
  print("PEG.js 0.1");
}

function printHelp() {
  print("Usage: pegjs [options] [--] <parserVar> [<input_file>] [<output_file>]");
  print("");
  print("Generates a parser from the PEG grammar specified in the <input_file> and");
  print("writes it to the <output_file>. The parser object will be stored in a variable");
  print("named <parser_var>.");
  print("");
  print("If the <output_file> is omitted, its name is generated by changing the");
  print("<input_file> extension to \".js\". If both <input_file> and <output_file> are");
  print("omitted, standard input and output are used.");
  print("");
  print("Options:");
  print("  -s, --start-rule    specify grammar start rule (default: \"start\")");
  print("  -v, --version       print version information and exit");
  print("  -h, --help          print help and exit");
}

function nextArg() {
  args.shift();
}

function exitSuccess() {
  quit(0);
}

function exitFailure() {
  quit(1);
}

function abort(message) {
  System.out.println(message);
  exitFailure();
}

var startRule = "start";

/*
 * The trimmed first argument is the script path -- see the beginning of this
 * file.
 */
var args = Array.prototype.slice.call(arguments, 1);

while (args.length > 0 && isOption(args[0])) {
  switch (args[0]) {
    case "-s":
    case "--start":
      nextArg();
      if (args.length === 0) {
        abort("Missing parameter of the -s/--start option.");
      }
      startRule = args[0];
      break;

    case "-v":
    case "--version":
      printVersion();
      exitSuccess();
      break;

    case "-h":
    case "--help":
      printHelp();
      exitSuccess();
      break;

    case "--":
      nextArg();
      break;

    default:
      abort("Unknown option: " + args[0] + ".");
  }
  nextArg();
}

if (args.length === 0) {
  abort("Too few arguments.");
}
var parserVar = args[0];
nextArg();

switch (args.length) {
  case 0:
    var inputFile = FILE_STDIN;
    var outputFile = FILE_STDOUT;
    break;
  case 1:
    var inputFile = args[0];
    var outputFile = args[0].replace(/\.[^.]*$/, ".js");
    break;
  case 2:
    var inputFile = args[0];
    var outputFile = args[1];
    break;
  default:
    abort("Too many arguments.");
}

var input = readFile(inputFile);
try {
  var parser = PEG.buildParser(input, startRule);
} catch (e) {
  if (e.line !== undefined && e.column !== undefined) {
    abort(e.line + ":" + e.column + ": " + e.message);
  } else {
    abort(e.message);
  }
}
writeFile(outputFile, parserVar + " = " + parser.toSource() + ";\n");
